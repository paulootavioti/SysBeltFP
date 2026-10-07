import { Request, Response } from "express";

import { CreateCurriculoService } from "./services/CreateCurriculoService";
import { ListCurriculosService } from "./services/ListCurriculosService";
import { GetCurriculoService } from "./services/GetCurriculoService";
import { CreateModuloCurriculoService } from "./services/CreateModuloCurriculoService";
import { CreateAulaCurriculoService } from "./services/CreateAulaCurriculoService";
import { CreateTecnicaCurriculoService } from "./services/CreateTecnicaCurriculoService";
import { UpdateCurriculoService } from "./services/UpdateCurriculoService";
import { UpdateModuloCurriculoService } from "./services/UpdateModuloCurriculoService";
import { UpdateAulaCurriculoService } from "./services/UpdateAulaCurriculoService";
import { UpdateTecnicaCurriculoService } from "./services/UpdateTecnicaCurriculoService";
import { DeleteCurriculoService } from "./services/DeleteCurriculoService";
import { DeleteModuloCurriculoService } from "./services/DeleteModuloCurriculoService";
import { DeleteAulaCurriculoService } from "./services/DeleteAulaCurriculoService";
import { DeleteTecnicaCurriculoService } from "./services/DeleteTecnicaCurriculoService";
import { DuplicateAulaCurriculoService } from "./services/DuplicateAulaCurriculoService";
import { CreateAulaAssistidaService } from "./services/CreateAulaAssistidaService";
import { ExportCurriculoService } from "./services/ExportCurriculoService";
import { ImportCurriculoService } from "./services/ImportCurriculoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";

export class CurriculosController {
  async listCatalogo(req: Request, res: Response) {
    const itens = await prismaDaRequisicao().itemCatalogoPedagogico.findMany({
      where: { unidadeId: requireUnidadeId(req) },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    });
    return res.json(itens);
  }

  async createCatalogo(req: Request, res: Response) {
    const item = await prismaDaRequisicao().itemCatalogoPedagogico.create({
      data: { ...req.body, unidadeId: requireUnidadeId(req) },
    });
    return res.status(201).json(item);
  }

  async deleteCatalogo(req: Request, res: Response) {
    const item = await prismaDaRequisicao().itemCatalogoPedagogico.findFirst({
      where: { id: Number(req.params.id), unidadeId: requireUnidadeId(req) },
    });
    if (!item) throw new AppError("Item pedagógico não encontrado.");
    await prismaDaRequisicao().itemCatalogoPedagogico.delete({ where: { id: item.id } });
    return res.status(204).send();
  }

  async create(req: Request, res: Response) {
    const service = new CreateCurriculoService();

    const curriculo = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(curriculo);
  }

  async list(req: Request, res: Response) {
    const service = new ListCurriculosService();

    const curriculos = await service.execute(req.user.unidadeId);

    return res.json(curriculos);
  }

  async show(req: Request, res: Response) {
    const service = new GetCurriculoService();

    const curriculo = await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.json(curriculo);
  }

  async export(req: Request, res: Response) {
    const arquivo = await new ExportCurriculoService().execute(Number(req.params.id), req.user.unidadeId);
    const nomeSeguro = arquivo.curriculo.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "planejamento";
    res.setHeader("Content-Disposition", `attachment; filename="${nomeSeguro}.json"`);
    return res.json(arquivo);
  }

  async import(req: Request, res: Response) {
    const resultado = await new ImportCurriculoService().execute(req.body, requireUnidadeId(req));
    return res.status(201).json(resultado);
  }

  async createModulo(req: Request, res: Response) {
    const service = new CreateModuloCurriculoService();

    const modulo = await service.execute(req.body, req.user.unidadeId);

    return res.status(201).json(modulo);
  }

  async createAula(req: Request, res: Response) {
    const service = new CreateAulaCurriculoService();

    const aula = await service.execute(req.body, req.user.unidadeId);

    return res.status(201).json(aula);
  }

  async createAulaAssistida(req: Request, res: Response) {
    const aula = await new CreateAulaAssistidaService().execute(req.body, req.user.unidadeId);
    return res.status(201).json(aula);
  }

  async createTecnica(req: Request, res: Response) {
    const service = new CreateTecnicaCurriculoService();

    const tecnica = await service.execute(req.body, req.user.unidadeId);

    return res.status(201).json(tecnica);
  }

  async update(req: Request, res: Response) {
    const service = new UpdateCurriculoService();

    const curriculo = await service.execute(Number(req.params.id), req.body, req.user.unidadeId);

    return res.json(curriculo);
  }

  async updateModulo(req: Request, res: Response) {
    const service = new UpdateModuloCurriculoService();

    const modulo = await service.execute(Number(req.params.id), req.body, req.user.unidadeId);

    return res.json(modulo);
  }

  async updateAula(req: Request, res: Response) {
    const service = new UpdateAulaCurriculoService();

    const aula = await service.execute(Number(req.params.id), req.body, req.user.unidadeId);

    return res.json(aula);
  }

  async updateTecnica(req: Request, res: Response) {
    const service = new UpdateTecnicaCurriculoService();

    const tecnica = await service.execute(Number(req.params.id), req.body, req.user.unidadeId);

    return res.json(tecnica);
  }

  async duplicateAula(req: Request, res: Response) {
    const aula = await new DuplicateAulaCurriculoService().execute(Number(req.params.id), req.user.unidadeId);
    return res.status(201).json(aula);
  }

  async delete(req: Request, res: Response) {
    const service = new DeleteCurriculoService();

    await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.status(204).send();
  }

  async deleteModulo(req: Request, res: Response) {
    const service = new DeleteModuloCurriculoService();

    await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.status(204).send();
  }

  async deleteAula(req: Request, res: Response) {
    const service = new DeleteAulaCurriculoService();

    await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.status(204).send();
  }

  async deleteTecnica(req: Request, res: Response) {
    const service = new DeleteTecnicaCurriculoService();

    await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.status(204).send();
  }
}
