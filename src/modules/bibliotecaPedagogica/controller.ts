import { Request, Response } from "express";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { escopoUnidade, garantirAcessoUnidade } from "../../shared/utils/escopoUnidade";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

function visibilidade(unidadeId: number | null) {
  return { OR: [{ unidadeId: null }, escopoUnidade(unidadeId)] };
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
          ...(busca ? [{ OR: [{ nome: { contains: busca, mode: "insensitive" } }, { nomeAlternativo: { contains: busca, mode: "insensitive" } }, { categoria: { contains: busca, mode: "insensitive" } }, { objetivo: { contains: busca, mode: "insensitive" } }, { tags: { some: { tag: { nome: { contains: busca, mode: "insensitive" } } } } }] }] : []),
        ],
      },
      include: { modalidade: true, tags: { include: { tag: true } }, filhos: { select: { id: true, nome: true, tipo: true } } }, orderBy: [{ unidadeId: "asc" }, { nome: "asc" }],
    });
    return res.json(conteudos);
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

  async templates(req: Request, res: Response) {
    return res.json(await prismaDaRequisicao().templatePlanejamento.findMany({ where: { ativo: true, ...visibilidade(req.user.unidadeId) }, include: { etapas: { orderBy: { ordem: "asc" } }, modalidade: true }, orderBy: { nome: "asc" } }));
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
}
