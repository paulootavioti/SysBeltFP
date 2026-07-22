import { Request, Response } from "express";
import { prisma } from "../../shared/database/prisma";
import { CreateMensalidadeService } from "./services/CreateMensalidadeService";
import { ListMensalidadesService } from "./services/ListMensalidadesService";
import { GetMensalidadeService } from "./services/GetMensalidadeService";
import { GetMensalidadesVencidasService } from "./services/GetMensalidadesVencidasService";
import { PagarMensalidadeService } from "./services/PagarMensalidadeService";

export class MensalidadesController {

  async create(req: Request, res: Response) {

    const service =
      new CreateMensalidadeService();
  
  
    const mensalidade =
      await service.execute({
        ...req.body,
        valor: Number(req.body.valor),
        alunoId: Number(req.body.alunoId)
      });
  
  
    return res.status(201).json(mensalidade);
  }

  async list(req: Request, res: Response) {

    const service =
      new ListMensalidadesService();
  
    const mensalidades =
      await service.execute();
  
    return res.json(mensalidades);
  }

  async get(req: Request, res: Response) {

    const { id } = req.params;

    const service =
      new GetMensalidadeService();

    const mensalidade =
      await service.execute(
        Number(id)
      );

    return res.json(mensalidade);
  }

  // Mensalidades Vencidas
  async vencidas(req: Request, res: Response) {

    const service =
      new GetMensalidadesVencidasService();
  
    const mensalidades =
      await service.execute();
  
    return res.json(mensalidades);
  }

  // Marcar Mensalidade como Paga
  async pagar(req: Request, res: Response) {

    const { id } = req.params;
  
    const service =
      new PagarMensalidadeService();
  
    const mensalidade =
      await service.execute(
        Number(id)
      );
  
    return res.json(mensalidade);
  }

  //Inadinplentes **Este está em financeiro como indicador e aqui é uma lista
  // async inadimplentes(req: Request, res: Response) {

  //   const mensalidades = await prisma.mensalidade.findMany({
  //     where: {
  //       pago: false,
  //       vencimento: {
  //         lt: new Date()
  //       }
  //     },
  //     include: {
  //       aluno: true
  //     }
  //   });

  //   return res.json(mensalidades);
  // }
}