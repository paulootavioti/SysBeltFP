import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { escopoUnidade, garantirAcessoUnidade } from "../../shared/utils/escopoUnidade";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

function visibilidade(unidadeId: number | null) {
  return { OR: [{ unidadeId: null }, escopoUnidade(unidadeId)] };
}

function limitePagina(valor: unknown) {
  const limite = Number(valor) || 20;
  return Math.min(Math.max(limite, 1), 50);
}

function filtroBusca(busca: string): Prisma.ConteudoTecnicoWhereInput | undefined {
  if (!busca) return undefined;
  const texto = { contains: busca, mode: "insensitive" as const };
  return { OR: [{ nome: texto }, { nomeAlternativo: texto }, { categoria: texto }, { objetivo: texto }, { tags: { some: { tag: { nome: texto } } } }] };
}

export class BibliotecaPedagogicaController {
  async modalidades(_req: Request, res: Response) {
    return res.json(await prismaDaRequisicao().bibliotecaModalidade.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } }));
  }

  async listar(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const busca = String(req.query.busca ?? "").trim();
    const tipo = typeof req.query.tipo === "string" ? req.query.tipo : undefined;
    const nivelDificuldade = typeof req.query.nivel === "string" ? req.query.nivel : undefined;
    const modalidadeId = Number(req.query.modalidadeId) || undefined;
    const favoritos = req.query.favoritos === "true" ? true : undefined;
    const conteudos = await prisma.conteudoTecnico.findMany({
      take: 60,
      where: {
        ativo: true,
        ...(modalidadeId ? { modalidadeId } : {}),
        ...(tipo ? { tipo: tipo as never } : {}),
        ...(nivelDificuldade ? { nivelDificuldade: nivelDificuldade as never } : {}),
        ...(favoritos ? { favorito: true } : {}),
        AND: [
          visibilidade(req.user.unidadeId),
          ...(filtroBusca(busca) ? [filtroBusca(busca)!] : []),
        ],
      },
      include: { modalidade: true, tags: { include: { tag: true } }, filhos: { select: { id: true, nome: true, tipo: true } } }, orderBy: [{ unidadeId: "asc" }, { nome: "asc" }],
    });
    return res.json(conteudos);
  }

  // Busca voltada ao construtor de aula. Mantém a rota legada acima para não
  // alterar consumidores existentes e evita baixar a biblioteca inteira.
  async pesquisar(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const busca = String(req.query.busca ?? "").trim();
    const modalidadeLocalId = Number(req.query.modalidadeLocalId) || undefined;
    const modalidadeInformada = Number(req.query.modalidadeId) || undefined;
    const cursor = Number(req.query.cursor) || undefined;
    const limite = limitePagina(req.query.limite);
    const idade = Number(req.query.idade) || undefined;
    const nivel = typeof req.query.nivel === "string" ? req.query.nivel : undefined;

    const modalidadeLocal = modalidadeLocalId
      ? await prisma.modalidade.findFirst({ where: { id: modalidadeLocalId, ...escopoUnidade(req.user.unidadeId) }, select: { bibliotecaModalidadeId: true } })
      : null;
    if (modalidadeLocalId && !modalidadeLocal) throw new AppError("Modalidade não encontrada.", 404);
    const modalidadeId = modalidadeInformada ?? modalidadeLocal?.bibliotecaModalidadeId ?? undefined;

    const where: Prisma.ConteudoTecnicoWhereInput = {
      ativo: true,
      ...(modalidadeId ? { modalidadeId } : {}),
      ...(nivel ? { nivelDificuldade: nivel as never } : {}),
      AND: [
        visibilidade(req.user.unidadeId),
        ...(idade ? [{ OR: [{ faixaEtariaMinima: null }, { faixaEtariaMinima: { lte: idade } }] }, { OR: [{ faixaEtariaMaxima: null }, { faixaEtariaMaxima: { gte: idade } }] }] : []),
        ...(filtroBusca(busca) ? [filtroBusca(busca)!] : []),
      ],
    };
    const conteudos = await prisma.conteudoTecnico.findMany({
      where,
      take: limite + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      include: { modalidade: true, tags: { include: { tag: true } } },
    });
    const temProximaPagina = conteudos.length > limite;
    if (temProximaPagina) conteudos.pop();
    return res.json({ itens: conteudos, proximoCursor: temProximaPagina ? conteudos[conteudos.length - 1]?.id ?? null : null, modalidadeId: modalidadeId ?? null });
  }

  async criar(req: Request, res: Response) {
    const prisma = prismaDaRequisicao(); const { tags, ...dados } = req.body;
    const unidadeId = requireUnidadeId(req);
    if (dados.conteudoPaiId) {
      const pai = await prisma.conteudoTecnico.findFirst({ where: { id: dados.conteudoPaiId, ...visibilidade(req.user.unidadeId) } });
      if (!pai) throw new AppError("Conteúdo de referência não encontrado.");
    }
    const conteudo = await prisma.conteudoTecnico.create({
      data: {
        ...dados,
        unidadeId,
        tags: tags.length
          ? { create: tags.map((nome: string) => ({ tag: { create: { nome, unidadeId } } })) }
          : undefined,
      },
      include: { modalidade: true, tags: { include: { tag: true } } },
    });
    return res.status(201).json(conteudo);
  }

  async copiar(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const origem = await prisma.conteudoTecnico.findFirst({
      where: { id: Number(req.params.id), ...visibilidade(req.user.unidadeId) },
      include: { tags: { include: { tag: true } } },
    });
    if (!origem) throw new AppError("Conteúdo não encontrado.");
    const { id, unidadeId: _unidadeId, createdAt, updatedAt, tags, ...dados } = origem;
    const copia = await prisma.conteudoTecnico.create({
      data: {
        ...dados,
        unidadeId: requireUnidadeId(req),
        nome: `${origem.nome} (minha versão)`,
        tags: tags.length
          ? { create: tags.map(({ tag }) => ({ tag: { create: { nome: tag.nome, unidadeId: requireUnidadeId(req) } } })) }
          : undefined,
      },
    });
    return res.status(201).json(copia);
  }

  async atualizar(req: Request, res: Response) {
    const prisma = prismaDaRequisicao(); const atual = await prisma.conteudoTecnico.findUnique({ where: { id: Number(req.params.id) } });
    if (!atual || atual.unidadeId === null) throw new AppError("Somente cópias da sua academia podem ser alteradas.", 403);
    garantirAcessoUnidade(req.user.unidadeId, atual.unidadeId, "Conteúdo não encontrado.");
    const { tags, ...dados } = req.body;
    return res.json(await prisma.conteudoTecnico.update({
      where: { id: atual.id },
      data: {
        ...dados,
        tags: {
          deleteMany: {},
          ...(tags?.length ? { create: tags.map((nome: string) => ({ tag: { create: { nome, unidadeId: atual.unidadeId } } })) } : {}),
        },
      },
    }));
  }

  async desativar(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const atual = await prisma.conteudoTecnico.findUnique({ where: { id: Number(req.params.id) } });
    if (!atual || atual.unidadeId === null) throw new AppError("Somente conteúdos da sua academia podem ser removidos.", 403);
    garantirAcessoUnidade(req.user.unidadeId, atual.unidadeId, "Conteúdo não encontrado.");
    await prisma.conteudoTecnico.update({ where: { id: atual.id }, data: { ativo: false } });
    return res.status(204).send();
  }

  async templates(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const modalidadeLocalId = Number(req.query.modalidadeLocalId) || undefined;
    const modalidadeLocal = modalidadeLocalId
      ? await prisma.modalidade.findFirst({ where: { id: modalidadeLocalId, ...escopoUnidade(req.user.unidadeId) }, select: { bibliotecaModalidadeId: true } })
      : null;
    if (modalidadeLocalId && !modalidadeLocal) throw new AppError("Modalidade não encontrada.", 404);
    return res.json(await prisma.templatePlanejamento.findMany({
      where: { ativo: true, ...visibilidade(req.user.unidadeId), ...(modalidadeLocal?.bibliotecaModalidadeId ? { OR: [{ modalidadeId: null }, { modalidadeId: modalidadeLocal.bibliotecaModalidadeId }] } : {}) },
      include: { etapas: { orderBy: { ordem: "asc" } }, modalidade: true }, orderBy: { nome: "asc" },
    }));
  }

  async criarTemplate(req: Request, res: Response) {
    const { etapas, ...dados } = req.body;
    return res.status(201).json(await prismaDaRequisicao().templatePlanejamento.create({
      data: {
        ...dados,
        unidadeId: requireUnidadeId(req),
        etapas: { create: etapas.map((etapa: Record<string, unknown>, ordem: number) => ({ ...etapa, ordem })) },
      },
      include: { etapas: { orderBy: { ordem: "asc" } } },
    }));
  }

  async atualizarTemplate(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const atual = await prisma.templatePlanejamento.findUnique({ where: { id: Number(req.params.id) } });
    if (!atual || atual.unidadeId === null) throw new AppError("Somente modelos da sua academia podem ser alterados.", 403);
    garantirAcessoUnidade(req.user.unidadeId, atual.unidadeId, "Modelo não encontrado.");
    const { etapas, ...dados } = req.body;
    return res.json(await prisma.templatePlanejamento.update({
      where: { id: atual.id },
      data: { ...dados, versao: { increment: 1 }, etapas: { deleteMany: {}, create: etapas.map((etapa: Record<string, unknown>, ordem: number) => ({ ...etapa, ordem })) } },
      include: { etapas: { orderBy: { ordem: "asc" } }, modalidade: true },
    }));
  }

  async desativarTemplate(req: Request, res: Response) {
    const prisma = prismaDaRequisicao();
    const atual = await prisma.templatePlanejamento.findUnique({ where: { id: Number(req.params.id) } });
    if (!atual || atual.unidadeId === null) throw new AppError("Somente modelos da sua academia podem ser removidos.", 403);
    garantirAcessoUnidade(req.user.unidadeId, atual.unidadeId, "Modelo não encontrado.");
    await prisma.templatePlanejamento.update({ where: { id: atual.id }, data: { ativo: false } });
    return res.status(204).send();
  }
}
