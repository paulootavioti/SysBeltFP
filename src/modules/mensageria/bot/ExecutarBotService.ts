import { Prisma } from "@prisma/client";
import { normalizarTelefoneBR } from "../../whatsapp/utils/telefone";
import { estadoInicialBot, processarMensagemBot, type EstadoBot, type ResultadoBot } from "./MotorBot";
import { normalizarPassosBot, PASSOS_PADRAO } from "./fluxoBot";

type Tx = Prisma.TransactionClient;

function temTelefone(pessoa: { telefone: string | null; whatsapp: string | null }, telefone: string) {
  return normalizarTelefoneBR(pessoa.telefone) === telefone || normalizarTelefoneBR(pessoa.whatsapp) === telefone;
}

async function escolherResponsavel(tx: Tx, unidadeId: number) {
  const usuarios = await tx.usuario.findMany({
    where: {
      ativo: true, perfil: { in: ["ADMIN", "RECEPCAO"] },
      OR: [{ unidadeId }, { unidadesVinculadas: { some: { unidadeId } } }],
    },
    select: { id: true, _count: { select: { leadsResponsavel: { where: { estagio: { notIn: ["MATRICULADO", "PERDIDO"] } } } } } },
    orderBy: { id: "asc" },
  });
  return usuarios.sort((a, b) => a._count.leadsResponsavel - b._count.leadsResponsavel || a.id - b.id)[0]?.id ?? null;
}

async function transferir(tx: Tx, conversaId: number, motivo: string) {
  await tx.conversaMensageria.update({ where: { id: conversaId }, data: { estado: "AGUARDANDO_EQUIPE" } });
  const conversa = await tx.conversaMensageria.findUnique({ where: { id: conversaId }, select: { leadId: true, unidadeId: true } });
  if (conversa?.leadId) await tx.leadEvento.create({
    data: { leadId: conversa.leadId, unidadeId: conversa.unidadeId, tipo: "TRANSFERIDO_PELO_BOT", descricao: "Conversa transferida para a equipe.", payload: { conversaId, motivo } },
  });
}

async function criarOuVincularLead(tx: Tx, conversaId: number, respostas: EstadoBot["respostas"]) {
  const conversa = await tx.conversaMensageria.findUniqueOrThrow({
    where: { id: conversaId },
    include: { unidade: { select: { contaId: true } }, canalMensageria: true },
  });
  const telefone = typeof respostas.telefoneE164 === "string" ? respostas.telefoneE164 : "";
  if (!telefone) return;
  const unidades = await tx.unidade.findMany({ where: { contaId: conversa.unidade.contaId }, select: { id: true } });
  const unidadeIds = unidades.map(({ id }) => id);
  const existente = await tx.lead.findFirst({ where: { unidadeId: { in: unidadeIds }, telefoneE164: telefone } });
  if (existente) {
    await tx.conversaMensageria.update({ where: { id: conversaId }, data: { leadId: existente.id, estado: "AGUARDANDO_EQUIPE" } });
    await registrarConsentimento(tx, existente.id, conversa.canalMensageriaId, respostas);
    return;
  }
  const [alunos, responsaveis] = await Promise.all([
    tx.aluno.findMany({ where: { unidadeId: { in: unidadeIds } }, select: { id: true, ativo: true, telefone: true, whatsapp: true } }),
    tx.responsavel.findMany({ where: { unidadeId: { in: unidadeIds } }, select: { telefone: true, whatsapp: true } }),
  ]);
  const aluno = alunos.find((item) => temTelefone(item, telefone));
  if (aluno?.ativo || responsaveis.some((item) => temTelefone(item, telefone))) {
    await tx.conversaMensageria.update({ where: { id: conversaId }, data: { alunoId: aluno?.id, estado: "AGUARDANDO_EQUIPE" } });
    return;
  }
  const slug = `bot-${conversa.canalMensageria.tipo.toLowerCase()}-${conversa.unidadeId}`;
  const canal = await tx.canalCaptacao.upsert({
    where: { slug },
    create: { unidadeId: conversa.unidadeId, nome: `Bot ${conversa.canalMensageria.nomeExibicao}`, slug },
    update: { ativo: true },
  });
  if (conversa.canalMensageria.canalCaptacaoId !== canal.id) await tx.canalMensageria.update({
    where: { id: conversa.canalMensageriaId }, data: { canalCaptacaoId: canal.id },
  });
  const responsavelUsuarioId = await escolherResponsavel(tx, conversa.unidadeId);
  const lead = await tx.lead.create({
    data: {
      unidadeId: conversa.unidadeId, canalId: canal.id, nome: String(respostas.nome ?? conversa.contatoNome ?? "Contato"), telefoneE164: telefone,
      tipoContato: respostas.tipoContato === "RESPONSAVEL" ? "RESPONSAVEL" : "PRATICANTE",
      praticanteNome: typeof respostas.praticanteNome === "string" ? respostas.praticanteNome : null,
      praticanteNascimento: typeof respostas.praticanteNascimento === "string" ? new Date(respostas.praticanteNascimento) : null,
      situacao: aluno ? "EX_ALUNO" : respostas.situacao === "TREINA_EM_OUTRA" || respostas.situacao === "EX_ALUNO" ? respostas.situacao : "NUNCA_TREINOU",
      turnoPreferido: typeof respostas.turnoPreferido === "string" ? [respostas.turnoPreferido] : [],
      alunoId: aluno?.id, responsavelUsuarioId, proximaAcaoEm: new Date(Date.now() + 15 * 60_000),
      eventos: { create: { unidadeId: conversa.unidadeId, tipo: "CAPTADO_PELO_BOT", descricao: "Lead qualificado e transferido pelo bot.", payload: { conversaId, canalMensageriaId: conversa.canalMensageriaId } } },
    },
  });
  await registrarConsentimento(tx, lead.id, conversa.canalMensageriaId, respostas);
  await tx.conversaMensageria.update({ where: { id: conversaId }, data: { leadId: lead.id, alunoId: aluno?.id, estado: "AGUARDANDO_EQUIPE" } });
}

async function registrarConsentimento(tx: Tx, leadId: number, canalMensageriaId: number, respostas: EstadoBot["respostas"]) {
  if (respostas.consentimento !== true) return;
  const texto = String(respostas.consentimentoTexto ?? "");
  const versao = String(respostas.consentimentoVersao ?? "");
  if (!texto || !versao) return;
  const existe = await tx.leadConsentimento.findFirst({ where: { leadId, finalidade: "TRATAMENTO_DADOS", textoAceito: texto, versao, revogadoEm: null } });
  if (!existe) await tx.leadConsentimento.create({ data: { leadId, canalMensageriaId, finalidade: "TRATAMENTO_DADOS", textoAceito: texto, versao } });
}

export async function executarBotNoEvento(tx: Tx, dados: {
  conversaId: number; canalMensageriaId: number; eventoExternoId: string; conteudo?: string;
}) {
  if (!dados.conteudo) return;
  const conversa = await tx.conversaMensageria.findUniqueOrThrow({
    where: { id: dados.conversaId }, include: { unidade: { select: { nome: true } }, canalMensageria: { select: { tipo: true } } },
  });
  let sessao = await tx.botSessao.findFirst({ where: { conversaId: conversa.id, finalizadoEm: null }, orderBy: { criadoEm: "desc" } });
  let fluxo = sessao ? await tx.botFluxo.findUniqueOrThrow({ where: { id: sessao.botFluxoId } })
    : await tx.botFluxo.findFirst({ where: { unidadeId: conversa.unidadeId, ativo: true }, orderBy: { criadoEm: "desc" } });
  fluxo ??= await tx.botFluxo.create({ data: { unidadeId: conversa.unidadeId, nome: "Captação padrão", versao: "1.0.0", passos: PASSOS_PADRAO as unknown as Prisma.InputJsonValue } });
  if (!sessao) sessao = await tx.botSessao.create({
    data: { conversaId: conversa.id, botFluxoId: fluxo.id, passoAtual: "INICIO", respostas: {}, expiraEm: new Date(Date.now() + 24 * 60 * 60_000) },
  });
  const estado: EstadoBot = {
    passo: sessao.passoAtual as EstadoBot["passo"], respostas: sessao.respostas as EstadoBot["respostas"],
    canal: conversa.canalMensageria.tipo, academia: conversa.unidade.nome, contatoExternoId: conversa.contatoExternoId,
  };
  const resultado: ResultadoBot = processarMensagemBot(estado, dados.conteudo, normalizarPassosBot(fluxo.passos));
  await tx.botSessao.update({ where: { id: sessao.id }, data: {
    passoAtual: resultado.estado.passo, respostas: resultado.estado.respostas as Prisma.InputJsonValue,
    expiraEm: new Date(Date.now() + 24 * 60 * 60_000), finalizadoEm: resultado.estado.passo === "FINALIZADO" ? new Date() : null,
  } });
  if (resultado.mensagens.length) await tx.mensagemMensageria.createMany({ data: resultado.mensagens.map((mensagem, indice) => ({
    conversaId: conversa.id, canalMensageriaId: dados.canalMensageriaId,
    mensagemExternaId: `${dados.eventoExternoId}:bot:${indice}`, direcao: "SAIDA", autor: "BOT",
    conteudo: mensagem.texto, tipoConteudo: mensagem.botoes ? "BOTAO" : "TEXTO", payload: mensagem.botoes ? { botoes: mensagem.botoes } : undefined,
    statusEntrega: "PENDENTE", enviadaEm: new Date(),
  })), skipDuplicates: true });
  for (const efeito of resultado.efeitos) {
    if (efeito.tipo === "CRIAR_LEAD") await criarOuVincularLead(tx, conversa.id, resultado.estado.respostas);
    if (efeito.tipo === "TRANSFERIR_EQUIPE") await transferir(tx, conversa.id, efeito.motivo);
  }
  if (!resultado.efeitos.some(({ tipo }) => tipo === "TRANSFERIR_EQUIPE")) await tx.conversaMensageria.update({ where: { id: conversa.id }, data: { estado: "BOT_EM_ANDAMENTO" } });
}
