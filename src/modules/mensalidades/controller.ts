import { Request, Response } from "express";
import { CreateMensalidadeService } from "./services/CreateMensalidadeService";
import { ListMensalidadesService } from "./services/ListMensalidadesService";
import { GetMensalidadeService } from "./services/GetMensalidadeService";
import { GetMensalidadesVencidasService } from "./services/GetMensalidadesVencidasService";
import { PagarMensalidadeService } from "./services/PagarMensalidadeService";
import { CancelarMensalidadeService } from "./services/CancelarMensalidadeService";
import { EstornarMensalidadeService } from "./services/EstornarMensalidadeService";
import { RegistrarComprovanteService } from "./services/RegistrarComprovanteService";
import { GetHistoricoAlunoService } from "./services/GetHistoricoAlunoService";

export class MensalidadesController {

  async create(req: Request, res: Response) {

    const service =
      new CreateMensalidadeService();


    const mensalidade =
      await service.execute({
        ...req.body,
        valor: Number(req.body.valor),
        alunoId: Number(req.body.alunoId),
        unidadeIdUsuario: req.user.unidadeId,
        usuarioId: req.user.id,
      });


    return res.status(201).json(mensalidade);
  }

  async list(req: Request, res: Response) {

    const service =
      new ListMensalidadesService();

    const mensalidades =
      await service.execute(req.user.unidadeId);

    return res.json(mensalidades);
  }

  async get(req: Request, res: Response) {

    const { id } = req.params;

    const service =
      new GetMensalidadeService();

    const mensalidade =
      await service.execute(
        Number(id),
        req.user.unidadeId
      );

    return res.json(mensalidade);
  }

  // Mensalidades Vencidas
  async vencidas(req: Request, res: Response) {

    const service =
      new GetMensalidadesVencidasService();

    const mensalidades =
      await service.execute(req.user.unidadeId);

    return res.json(mensalidades);
  }

  // Marcar Mensalidade como Paga
  async pagar(req: Request, res: Response) {

    const { id } = req.params;

    const service =
      new PagarMensalidadeService();

    const mensalidade =
      await service.execute(
        Number(id),
        req.user.unidadeId,
        req.user.id,
        req.body
      );

    return res.json(mensalidade);
  }

  async cancelar(req: Request, res: Response) {
    const { id } = req.params;

    const service = new CancelarMensalidadeService();

    const mensalidade = await service.execute(
      Number(id),
      req.user.unidadeId,
      req.user.id,
      req.body.motivo
    );

    return res.json(mensalidade);
  }

  async estornar(req: Request, res: Response) {
    const { id } = req.params;

    const service = new EstornarMensalidadeService();

    const mensalidade = await service.execute(
      Number(id),
      req.user.unidadeId,
      req.user.id,
      req.body.motivo
    );

    return res.json(mensalidade);
  }

  async registrarComprovante(req: Request, res: Response) {
    const { id } = req.params;

    const service = new RegistrarComprovanteService();

    const mensalidade = await service.execute(
      Number(id),
      req.user.unidadeId,
      req.user.id,
      req.body.comprovanteUrl
    );

    return res.json(mensalidade);
  }

  async historicoAluno(req: Request, res: Response) {
    const { alunoId } = req.params;

    const service = new GetHistoricoAlunoService();

    const historico = await service.execute(Number(alunoId), req.user.unidadeId);

    return res.json(historico);
  }
}
