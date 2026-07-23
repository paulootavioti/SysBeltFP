import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";

import { StartAulaService } from "./services/StartAulaService";
import { ListAulasService } from "./services/ListAulasService";
import { GetAulaService } from "./services/GetAulaService";
import { FinalizarAulaService } from "./services/FinalizarAulaService";
import { UpdateAulaAlunoService } from "./services/UpdateAulaAlunoService";

import { CreateAulaProgramadaService } from "./services/CreateAulaProgramadaService";
import { ListAulasProgramadasService } from "./services/ListAulasProgramadasService";
import { IniciarAulaProgramadaService } from "./services/IniciarAulaProgramadaService";
import { DeleteAulaService } from "./services/DeleteAulaService";
import { DeleteAulaProgramadaService } from "./services/DeleteAulaProgramadaService";
import { UpdateAulaService } from "./services/UpdateAulaService";
import { GetGradeSemanalService } from "./services/GetGradeSemanalService";
import { UpdateAulaProgramadaService } from "./services/UpdateAulaProgramadaService";
import { CancelarAulaProgramadaService } from "./services/CancelarAulaProgramadaService";
import { ReplicarProgramacaoService } from "./services/ReplicarProgramacaoService";
import { GetResumoTurmasProgramadasService } from "./services/GetResumoTurmasProgramadasService";
import { GetResumoTurmasAulasService } from "./services/GetResumoTurmasAulasService";
import { AvisoCancelamentoAulaService } from "../mensagens/services/AvisoCancelamentoAulaService";
import { PERIODOS_CONTAGEM_VALIDOS, type PeriodoContagem } from "./utils/periodoContagem";

function lerPeriodo(req: Request): PeriodoContagem | undefined {
  if (!req.query.periodo) return undefined;

  const periodo = String(req.query.periodo).toUpperCase();

  if (!PERIODOS_CONTAGEM_VALIDOS.includes(periodo as PeriodoContagem)) {
    throw new AppError(
      `Período inválido. Use um dos seguintes: ${PERIODOS_CONTAGEM_VALIDOS.join(", ")}.`
    );
  }

  return periodo as PeriodoContagem;
}

export class AulasController {
  async create(req: Request, res: Response) {
    const service = new StartAulaService();

    const aula = await service.execute(req.body);

    return res.status(201).json(aula);
  }

  async list(req: Request, res: Response) {
    const service = new ListAulasService();

    const aulas = await service.execute({
      turmaId: req.query.turmaId ? Number(req.query.turmaId) : undefined,
      periodo: lerPeriodo(req),
    });

    return res.json(aulas);
  }

  async resumoTurmas(req: Request, res: Response) {
    const service = new GetResumoTurmasAulasService();

    const periodo = lerPeriodo(req) ?? "SEMANAL";

    const resumo = await service.execute(periodo);

    return res.json(resumo);
  }

  async show(req: Request, res: Response) {
    const service = new GetAulaService();

    const aula = await service.execute(Number(req.params.id));

    return res.json(aula);
  }

  async finalizar(req: Request, res: Response) {
    const service = new FinalizarAulaService();

    const aula = await service.execute(
      Number(req.params.id)
    );

    return res.json(aula);
  }

  async updateAluno(req: Request, res: Response) {
    const service = new UpdateAulaAlunoService();

    const registro = await service.execute({
      id: Number(req.params.id),
      ...req.body,
    });

    return res.json(registro);
  }

  async criarProgramada(req: Request, res: Response) {
    const service = new CreateAulaProgramadaService();

    const programacao = await service.execute(req.body);

    return res.status(201).json(programacao);
  }

  async listarProgramadas(req: Request, res: Response) {
    const service = new ListAulasProgramadasService();

    const programacoes = await service.execute({
      turmaId: req.query.turmaId ? Number(req.query.turmaId) : undefined,
      periodo: lerPeriodo(req),
    });

    return res.json(programacoes);
  }

  async resumoTurmasProgramadas(req: Request, res: Response) {
    const service = new GetResumoTurmasProgramadasService();

    const periodo = lerPeriodo(req) ?? "SEMANAL";

    const resumo = await service.execute(periodo);

    return res.json(resumo);
  }

  async iniciarProgramada(req: Request, res: Response) {
    const service = new IniciarAulaProgramadaService();

    const aula = await service.execute(Number(req.params.id));

    return res.json(aula);
  }

  async updateProgramada(req: Request, res: Response) {
    const service = new UpdateAulaProgramadaService();

    const programacao = await service.execute(Number(req.params.id), req.body);

    return res.json(programacao);
  }

  async cancelarProgramada(req: Request, res: Response) {
    const cancelarService = new CancelarAulaProgramadaService();

    const programacao = await cancelarService.execute(Number(req.params.id));

    const avisoService = new AvisoCancelamentoAulaService();

    const avisos = await avisoService.execute(programacao.turmaId, programacao.data);

    return res.json({ programacao, avisos });
  }

  async replicarProgramada(req: Request, res: Response) {
    const service = new ReplicarProgramacaoService();

    const resultado = await service.execute(req.body);

    return res.status(201).json(resultado);
  }

  async delete(req: Request, res: Response) {
    const service = new DeleteAulaService();

    await service.execute(Number(req.params.id));

    return res.status(204).send();
  }

  async deleteProgramada(req: Request, res: Response) {
    const service = new DeleteAulaProgramadaService();

    await service.execute(Number(req.params.id));

    return res.status(204).send();
  }

  async update(req: Request, res: Response) {
    const service = new UpdateAulaService();

    const aula = await service.execute(Number(req.params.id), req.body);

    return res.json(aula);
  }

  async gradeSemanal(req: Request, res: Response) {
    const service = new GetGradeSemanalService();

    const referencia = req.query.data ? new Date(String(req.query.data)) : new Date();

    const grade = await service.execute(referencia);

    return res.json(grade);
  }
}
