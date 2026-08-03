import { Request, Response } from "express";
import { StatusLead } from "@prisma/client";

import { ListLeadsService } from "./services/ListLeadsService";
import { AtualizarStatusLeadService } from "./services/AtualizarStatusLeadService";

export class LeadsController {
  async list(req: Request, res: Response) {
    const service = new ListLeadsService();

    const { status } = req.query;

    const leads = await service.execute(req.user.unidadeId, {
      status: typeof status === "string" ? (status as StatusLead) : undefined,
    });

    return res.json(leads);
  }

  async atualizarStatus(req: Request, res: Response) {
    const { id } = req.params;

    const service = new AtualizarStatusLeadService();

    const lead = await service.execute(Number(id), req.body.status, req.user.unidadeId);

    return res.json(lead);
  }
}
