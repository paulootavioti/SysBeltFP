import { createHash, randomBytes } from "node:crypto";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { obterContextoRequisicao } from "../../shared/context/contextoRequisicao";

const PADROES = [
  ["Alexa, pausa para água", "Equipe, 1 minuto para água.", "BLOCO_PAUSA", 60, 10],
  ["Alexa, formação", "Atenção equipe, em 1 minuto arrumem a faixa e formação.", "BLOCO_PAUSA", 60, 10],
  ["Alexa, iniciar a aula do {turma}", "Aula do {turma} iniciada.", "INICIAR", null, null],
  ["Alexa, próximo round", "Round {n}, valendo.", "AVANCAR", null, 10],
  ["Alexa, quanto falta?", "Faltam {tempo} para o fim do bloco.", "CONSULTAR", null, null],
  ["Alexa, pausar o round", "Cronômetro pausado.", "PAUSAR", null, null],
] as const;

async function contaDaUnidade(unidadeId: number | null) {
  if (!unidadeId) throw new AppError("Selecione uma unidade ativa.");
  const unidade = await prismaDaRequisicao().unidade.findUnique({ where: { id: unidadeId }, select: { contaId: true } });
  if (!unidade) throw new AppError("Unidade não encontrada.");
  return unidade.contaId;
}

function hash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function normalizar(texto: string) { return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[?!.,]/g, "").replace(/^alexa\s+/, "").trim(); }
function substituirTudo(texto: string, busca: string, valor: string) { return texto.split(busca).join(valor); }
function preencher(texto: string, dados: { turma?: string; n?: number; tempo?: string }) {
  return substituirTudo(substituirTudo(substituirTudo(texto, "{turma}", dados.turma ?? "turma"), "{n}", String(dados.n ?? 1)), "{tempo}", dados.tempo ?? "alguns minutos");
}

export class ComandosVozService {
  async listar(unidadeId: number | null) {
    const db = prismaDaRequisicao();
    const contaId = await contaDaUnidade(unidadeId);
    await db.comandoVoz.createMany({ data: PADROES.map(([gatilho, resposta, acao, duracaoBlocoSegundos, avisoAntesFimSegundos]) => ({ contaId, gatilho, resposta, acao, duracaoBlocoSegundos, avisoAntesFimSegundos, doSistema: true })), skipDuplicates: true });
    const [comandos, arenas] = await Promise.all([
      db.comandoVoz.findMany({ where: { contaId, ativo: true }, orderBy: [{ doSistema: "desc" }, { gatilho: "asc" }] }),
      db.arena.findMany({ where: { unidadeId: unidadeId!, ativo: true }, select: { id: true, nome: true, pareamentoVoz: { select: { id: true, consentidoEm: true, revogadoEm: true } } }, orderBy: { nome: "asc" } }),
    ]);
    return { comandos, arenas };
  }

  async criar(dados: any, unidadeId: number | null) {
    return prismaDaRequisicao().comandoVoz.create({ data: { ...dados, contaId: await contaDaUnidade(unidadeId), doSistema: false } });
  }

  async atualizar(id: number, dados: any, unidadeId: number | null) {
    const db = prismaDaRequisicao();
    const contaId = await contaDaUnidade(unidadeId);
    const atual = await db.comandoVoz.findFirst({ where: { id, contaId } });
    if (!atual) throw new AppError("Comando não encontrado.", 404);
    const permitido = atual.doSistema ? { resposta: dados.resposta } : dados;
    return db.comandoVoz.update({ where: { id }, data: permitido });
  }

  async parear(arenaId: number, usuarioId: number, unidadeId: number | null) {
    const db = prismaDaRequisicao();
    const arena = await db.arena.findFirst({ where: { id: arenaId, unidadeId: unidadeId! } });
    if (!arena) throw new AppError("Arena não encontrada.", 404);
    const token = randomBytes(32).toString("base64url");
    const contexto = obterContextoRequisicao();
    await db.pareamentoVozArena.upsert({ where: { arenaId }, create: { arenaId, tokenHash: hash(token), versaoConsentimento: "voz-arena-v1", textoConsentimento: "Autorizo o microfone do dispositivo exclusivamente para comandos do cronômetro da arena, sem presença, nomes de alunos ou dados financeiros.", consentidoPorId: usuarioId, ip: contexto.ip, dispositivo: contexto.dispositivo }, update: { tokenHash: hash(token), revogadoEm: null, consentidoPorId: usuarioId, consentidoEm: new Date(), ip: contexto.ip, dispositivo: contexto.dispositivo } });
    return { tokenPareamento: token };
  }

  async testar(id: number, arenaId: number, unidadeId: number | null) {
    const db = prismaDaRequisicao();
    const contaId = await contaDaUnidade(unidadeId);
    const [comando, arena] = await Promise.all([db.comandoVoz.findFirst({ where: { id, contaId } }), db.arena.findFirst({ where: { id: arenaId, unidadeId: unidadeId!, pareamentoVoz: { revogadoEm: null } } })]);
    if (!comando || !arena) throw new AppError("Comando ou arena pareada não encontrado.", 404);
    return { simulado: true, resposta: preencher(comando.resposta, { turma: "turma de teste", n: 1, tempo: "1 minuto" }), alteraAula: false };
  }

  async executarSkill(token: string, dados: { gatilho: string; turma?: string; n?: number; tempo?: string }) {
    const db = prismaDaRequisicao();
    const pareamento = await db.pareamentoVozArena.findFirst({ where: { tokenHash: hash(token), revogadoEm: null }, include: { arena: { include: { unidade: true } } } });
    if (!pareamento) throw new AppError("Dispositivo não pareado.", 401);
    const comandos = await db.comandoVoz.findMany({ where: { contaId: pareamento.arena.unidade.contaId, ativo: true } });
    const comando = comandos.find((item) => normalizar(item.gatilho.replace("{turma}", dados.turma ?? "turma")) === normalizar(dados.gatilho));
    if (!comando) throw new AppError("Comando de cronômetro não reconhecido.", 404);
    await db.eventoComandoVoz.create({ data: { pareamentoId: pareamento.id, comandoId: comando.id, acao: comando.acao, duracaoBlocoSegundos: comando.duracaoBlocoSegundos, avisoAntesFimSegundos: comando.avisoAntesFimSegundos } });
    return { arenaId: pareamento.arenaId, acao: comando.acao, duracaoBlocoSegundos: comando.duracaoBlocoSegundos, avisoAntesFimSegundos: comando.avisoAntesFimSegundos, resposta: preencher(comando.resposta, dados) };
  }
}
