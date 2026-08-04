import { Request, Response } from "express";

import { GetEquipePublicaService } from "./services/GetEquipePublicaService";
import { GetHorariosPublicoService } from "./services/GetHorariosPublicoService";
import { GetProdutosDestaquePublicoService } from "./services/GetProdutosDestaquePublicoService";
import { GetGaleriaPublicaService } from "./services/GetGaleriaPublicaService";
import { GetModalidadesPublicoService } from "./services/GetModalidadesPublicoService";
import { CriarLeadPublicoService } from "./services/CriarLeadPublicoService";

export class PublicoController {
  async modalidades(req: Request, res: Response) {
    const service = new GetModalidadesPublicoService();
    const modalidades = await service.execute();

    return res.json(modalidades);
  }

  async equipe(req: Request, res: Response) {
    const service = new GetEquipePublicaService();
    const equipe = await service.execute();

    return res.json(equipe);
  }

  async horarios(req: Request, res: Response) {
    const service = new GetHorariosPublicoService();
    const horarios = await service.execute();

    return res.json(horarios);
  }

  async produtosDestaque(req: Request, res: Response) {
    const service = new GetProdutosDestaquePublicoService();
    const produtos = await service.execute();

    return res.json(produtos);
  }

  async galeria(req: Request, res: Response) {
    const service = new GetGaleriaPublicaService();
    const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
    const fotos = await service.execute(pagina);

    return res.json(fotos);
  }

  async criarLead(req: Request, res: Response) {
    const service = new CriarLeadPublicoService();
    const lead = await service.execute(req.body);

    return res.status(201).json(lead);
  }
}
