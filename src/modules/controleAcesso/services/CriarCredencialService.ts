import type { TipoCredencialAcesso } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { ConsultarConsentimentoService } from "../../consentimentos/services/ConsultarConsentimentoService";

const consultarConsentimento = new ConsultarConsentimentoService();

// Rosto e digital são dados biométricos, que a LGPD classifica como dado
// pessoal sensível (art. 5º, II) e exigem consentimento específico e
// destacado. Cartão, QR Code e PIN não são biometria — são credenciais
// que a academia entrega, e não passam por esta exigência.
const TIPOS_BIOMETRICOS: TipoCredencialAcesso[] = ["FACIAL", "BIOMETRIA"];

interface CriarCredencialDTO {
  alunoId?: number | null;
  usuarioId?: number | null;
  dispositivoId?: number | null;
  tipo: TipoCredencialAcesso;
  valor?: string | null;
  validoAte?: string | Date | null;
}

export class CriarCredencialService {
  async execute(dto: CriarCredencialDTO) {
    if (TIPOS_BIOMETRICOS.includes(dto.tipo) && dto.alunoId) {
      const liberado = await consultarConsentimento.temConsentimentoValido(
        dto.alunoId,
        "BIOMETRIA"
      );

      if (!liberado) {
        // Deixar cadastrar e "resolver depois" significaria já ter o
        // template biométrico no equipamento sem base legal pra isso.
        throw new AppError(
          "Não há consentimento de uso de biometria registrado para este aluno. " +
            "Registre o consentimento específico antes de cadastrar a credencial biométrica.",
          403
        );
      }
    }

    return prisma.credencialAcesso.create({
      data: {
        alunoId: dto.alunoId ?? null,
        usuarioId: dto.usuarioId ?? null,
        dispositivoId: dto.dispositivoId ?? null,
        tipo: dto.tipo,
        valor: dto.valor ?? null,
        validoAte: dto.validoAte ? new Date(dto.validoAte) : null,
      },
    });
  }
}
