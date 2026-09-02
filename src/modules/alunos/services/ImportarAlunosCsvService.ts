import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { Prisma } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { CreateAlunoService } from "./CreateAlunoService";

type LinhaCsv = Record<string, string>;
type EstrategiaDuplicado = "IGNORAR" | "ATUALIZAR";
type LinhaPrevia = {
  linha: number;
  dados: LinhaCsv;
  valido: boolean;
  duplicado: boolean;
  alunoExistenteId: number | null;
  erro: string | null;
  turmaId: number | null;
};

const aliases: Record<string, string> = {
  datanascimento: "dataNascimento", data_nascimento: "dataNascimento",
  nascimento: "dataNascimento", nomecompleto: "nome", nome_completo: "nome",
};

function normalizarCabecalho(valor: string) {
  const simples = valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
  return aliases[simples] ?? simples;
}

function normalizarData(valor: string) {
  const data = valor.trim();
  const brasileira = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
  return brasileira ? `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}` : data;
}

function lerArquivo(arquivo: Buffer): LinhaCsv[] {
  try {
    const linhas = parse(arquivo, {
      bom: true,
      columns: (cabecalhos: string[]) => cabecalhos.map(normalizarCabecalho),
      delimiter: [";", ","], skip_empty_lines: true, trim: true, relax_column_count: false,
    }) as LinhaCsv[];
    if (!linhas.length) throw new AppError("O arquivo não possui alunos para importar.");
    if (linhas.length > 500) throw new AppError("Importe no máximo 500 alunos por arquivo.");
    return linhas;
  } catch (erro) {
    if (erro instanceof AppError) throw erro;
    throw new AppError("O arquivo CSV está malformado. Verifique separadores, aspas e colunas.");
  }
}

export class ImportarAlunosCsvService {
  async previsualizar(arquivo: Buffer, unidadeId: number) {
    const prisma = prismaDaRequisicao();
    const linhas = lerArquivo(arquivo);
    const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId }, select: { contaId: true } });
    if (!unidade) throw new AppError("Unidade não encontrada.", 404);
    const [turmas, existentes] = await Promise.all([
      prisma.turma.findMany({ where: { unidadeId, ativo: true }, select: { id: true, nome: true } }),
      prisma.aluno.findMany({ where: { unidade: { contaId: unidade.contaId } }, select: { id: true, nome: true, dataNascimento: true } }),
    ]);
    const turmaPorNome = new Map(turmas.map((item) => [item.nome.trim().toLocaleLowerCase("pt-BR"), item.id]));
    const existentePorChave = new Map(existentes.map((item) => [this.chave(item.nome, item.dataNascimento), item.id]));
    const previa: LinhaPrevia[] = linhas.map((dados, indice) => {
      const nome = dados.nome?.trim() ?? "";
      const dataTexto = normalizarData(dados.dataNascimento ?? "");
      const data = new Date(dataTexto);
      let erro: string | null = null;
      if (!nome || !dataTexto) erro = "Nome e data de nascimento são obrigatórios.";
      else if (Number.isNaN(data.getTime())) erro = "Data de nascimento inválida.";
      const nomeTurma = dados.turma?.trim();
      const turmaId = nomeTurma ? turmaPorNome.get(nomeTurma.toLocaleLowerCase("pt-BR")) ?? null : null;
      if (!erro && nomeTurma && !turmaId) erro = `Turma ativa não encontrada: ${nomeTurma}.`;
      const alunoExistenteId = erro ? null : existentePorChave.get(this.chave(nome, data)) ?? null;
      return { linha: indice + 2, dados: { ...dados, nome, dataNascimento: dataTexto }, valido: !erro, duplicado: !!alunoExistenteId, alunoExistenteId, erro, turmaId };
    });
    return {
      hashArquivo: createHash("sha256").update(arquivo).digest("hex"),
      totalLinhas: previa.length,
      totalValidas: previa.filter((item) => item.valido).length,
      totalErros: previa.filter((item) => !item.valido).length,
      totalDuplicados: previa.filter((item) => item.duplicado).length,
      linhas: previa.slice(0, 20),
    };
  }

  async confirmar(arquivo: Buffer, unidadeId: number, nomeArquivo: string, estrategia: EstrategiaDuplicado) {
    const prisma = prismaDaRequisicao();
    const previa = await this.previsualizar(arquivo, unidadeId);
    const linhas = lerArquivo(arquivo);
    const lote = await prisma.importacaoAlunos.create({
      data: {
        unidadeId, nomeArquivo, hashArquivo: previa.hashArquivo, totalLinhas: previa.totalLinhas,
        totalCriados: 0, desfazivelAte: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    let criados = 0; let atualizados = 0; let ignorados = 0;
    const atualizacoesAntes: Array<{ id: number; dados: Record<string, unknown> }> = [];
    const erros: Array<{ linha: number; nome: string; erro: string }> = [];
    for (const [indice, original] of linhas.entries()) {
      const item = await this.prepararLinha(original, indice, unidadeId);
      if (!item.valido) { erros.push({ linha: item.linha, nome: item.dados.nome ?? "", erro: item.erro! }); continue; }
      if (item.alunoExistenteId) {
        if (estrategia === "IGNORAR") { ignorados++; continue; }
        const antes = await prisma.aluno.findUniqueOrThrow({
          where: { id: item.alunoExistenteId },
          select: {
            apelido: true, email: true, telefone: true, whatsapp: true,
            cpf: true, faixa: true, turmaId: true, observacoes: true,
          },
        });
        atualizacoesAntes.push({ id: item.alunoExistenteId, dados: antes });
        await prisma.aluno.update({
          where: { id: item.alunoExistenteId },
          data: {
            apelido: item.dados.apelido || undefined, email: item.dados.email || undefined,
            telefone: item.dados.telefone || undefined, whatsapp: item.dados.whatsapp || undefined,
            cpf: item.dados.cpf || undefined, faixa: item.dados.faixa || undefined,
            turmaId: item.turmaId ?? undefined, observacoes: item.dados.observacoes || undefined,
          },
        });
        atualizados++; continue;
      }
      try {
        const aluno = await new CreateAlunoService().execute({
          unidadeId, nome: item.dados.nome, dataNascimento: item.dados.dataNascimento,
          apelido: item.dados.apelido || null, email: item.dados.email || null,
          telefone: item.dados.telefone || null, whatsapp: item.dados.whatsapp || null,
          cpf: item.dados.cpf || null, faixa: item.dados.faixa || "Branca",
          turmaId: item.turmaId, observacoes: item.dados.observacoes || null,
        });
        await prisma.aluno.update({ where: { id: aluno.id }, data: { importacaoLoteId: lote.id } });
        criados++;
      } catch (erro) {
        erros.push({ linha: item.linha, nome: item.dados.nome, erro: erro instanceof Error ? erro.message : "Falha ao importar aluno." });
      }
    }
    const resultado = await prisma.importacaoAlunos.update({
      where: { id: lote.id },
      data: {
        totalCriados: criados,
        totalAtualizados: atualizados,
        totalIgnorados: ignorados,
        atualizacoesAntes: atualizacoesAntes as Prisma.InputJsonValue,
      },
    });
    return { loteId: resultado.id, desfazivelAte: resultado.desfazivelAte, totalLinhas: previa.totalLinhas, totalImportados: criados, totalAtualizados: atualizados, totalIgnorados: ignorados, totalErros: erros.length, erros };
  }

  async desfazer(loteId: number, unidadeId: number) {
    const prisma = prismaDaRequisicao();
    const lote = await prisma.importacaoAlunos.findFirst({ where: { id: loteId, unidadeId, status: "CONFIRMADA" }, include: { alunos: { select: { id: true } } } });
    if (!lote) throw new AppError("Importação não encontrada.", 404);
    if (lote.desfazivelAte < new Date()) throw new AppError("O prazo de 24 horas para desfazer terminou.");
    const ids = lote.alunos.map((aluno) => aluno.id);
    const atualizacoesAntes = Array.isArray(lote.atualizacoesAntes)
      ? lote.atualizacoesAntes as Array<{ id: number; dados: Record<string, string | number | null> }>
      : [];
    await prisma.$transaction(async (tx) => {
      await tx.consentimento.deleteMany({ where: { alunoId: { in: ids } } });
      await tx.alunoUnidade.deleteMany({ where: { alunoId: { in: ids } } });
      await tx.auditLog.deleteMany({ where: { entidade: "Aluno", entidadeId: { in: ids } } });
      await tx.aluno.deleteMany({ where: { id: { in: ids }, importacaoLoteId: lote.id } });
      for (const item of atualizacoesAntes) {
        await tx.aluno.update({
          where: { id: item.id },
          data: item.dados as Prisma.AlunoUpdateInput,
        });
      }
      await tx.importacaoAlunos.update({ where: { id: lote.id }, data: { status: "DESFEITA", desfeitaEm: new Date() } });
    });
    return { loteId, totalRemovidos: ids.length };
  }

  async execute(arquivo: Buffer, unidadeId: number) {
    const prisma = prismaDaRequisicao();
    const linhas = lerArquivo(arquivo);
    const turmas = await prisma.turma.findMany({ where: { unidadeId, ativo: true }, select: { id: true, nome: true } });
    const turmaPorNome = new Map(turmas.map((item) => [item.nome.trim().toLocaleLowerCase("pt-BR"), item.id]));
    const erros: Array<{ linha: number; nome: string; erro: string }> = [];
    const importados: Array<{ id: number; nome: string; senhaPortalGerada: string | null }> = [];
    for (const [indice, linha] of linhas.entries()) {
      const nome = linha.nome?.trim() ?? "";
      const dataNascimento = normalizarData(linha.dataNascimento ?? "");
      const nomeTurma = linha.turma?.trim();
      const turmaId = nomeTurma ? turmaPorNome.get(nomeTurma.toLocaleLowerCase("pt-BR")) : undefined;
      if (!nome || !dataNascimento) {
        erros.push({ linha: indice + 2, nome, erro: "Nome e data de nascimento são obrigatórios." }); continue;
      }
      if (nomeTurma && !turmaId) {
        erros.push({ linha: indice + 2, nome, erro: `Turma ativa não encontrada: ${nomeTurma}.` }); continue;
      }
      try {
        const aluno = await new CreateAlunoService().execute({
          unidadeId, nome, dataNascimento, apelido: linha.apelido || null,
          email: linha.email || null, telefone: linha.telefone || null,
          whatsapp: linha.whatsapp || null, cpf: linha.cpf || null,
          faixa: linha.faixa || "Branca", turmaId, observacoes: linha.observacoes || null,
        });
        importados.push({ id: aluno.id, nome: aluno.nome, senhaPortalGerada: aluno.senhaPortalGerada });
      } catch (erro) {
        erros.push({ linha: indice + 2, nome, erro: erro instanceof Error ? erro.message : "Falha ao importar aluno." });
      }
    }
    return { totalLinhas: linhas.length, totalImportados: importados.length, totalErros: erros.length, importados, erros };
  }

  private chave(nome: string, data: Date) {
    return `${nome.trim().toLocaleLowerCase("pt-BR")}|${data.toISOString().slice(0, 10)}`;
  }

  private async prepararLinha(dados: LinhaCsv, indice: number, unidadeId: number) {
    const nomeSeguro = (dados.nome ?? "").replace(/"/g, '""');
    const previa = await this.previsualizar(Buffer.from(`nome;dataNascimento;turma\n"${nomeSeguro}";${dados.dataNascimento ?? ""};${dados.turma ?? ""}`), unidadeId);
    const validada = previa.linhas[0];
    return { ...validada, linha: indice + 2, dados: { ...dados, ...validada.dados } };
  }
}
