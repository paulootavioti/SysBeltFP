import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { obterProvedorAcesso } from "../providers";
import { AutorizarAcessoService } from "./AutorizarAcessoService";
import { AvisarAcessoService } from "../../whatsapp/services/AvisarAcessoService";

interface RegistrarEventoAcessoDTO {
  dispositivoId: number;
  payload: unknown;
}

// Ponto de entrada dos eventos vindos do equipamento. Faz três coisas, nesta
// ordem: traduz o payload do fabricante (via provider), resolve de quem é a
// credencial, e grava o evento.
//
// Quando o equipamento decide localmente, a decisão dele é registrada como
// veio — mas o motor de regras roda mesmo assim, pra deixar no histórico
// quando equipamento e sistema discordam (ex.: catraca liberou alguém que já
// estava inadimplente porque a sincronização atrasou).
export class RegistrarEventoAcessoService {
  async execute({ dispositivoId, payload }: RegistrarEventoAcessoDTO) {
    const dispositivo = await prisma.dispositivoAcesso.findUnique({
      where: { id: dispositivoId },
    });

    if (!dispositivo) {
      throw new AppError("Dispositivo não encontrado.", 404);
    }

    if (!dispositivo.ativo) {
      throw new AppError("Dispositivo inativo.", 403);
    }

    const provedor = obterProvedorAcesso(dispositivo.provedor);
    const evento = provedor.normalizarEvento(payload);

    // reenvio do mesmo evento (equipamento reconectando) não duplica.
    if (evento.provedorEventoId) {
      const jaRegistrado = await prisma.eventoAcesso.findFirst({
        where: { dispositivoId, provedorEventoId: evento.provedorEventoId },
      });

      if (jaRegistrado) {
        return jaRegistrado;
      }
    }

    const credencial = await this.localizarCredencial(evento.provedorPessoaId, evento.referenciaExterna);

    const decisao = await new AutorizarAcessoService().execute({
      credencialId: credencial?.id ?? null,
      sentido: evento.sentido,
    });

    // o equipamento que decide localmente manda a decisão dele; quem só lê
    // manda o evento cru e quem decide é o motor.
    const autorizado = provedor.decideLocalmente ? evento.autorizado : decisao.autorizado;

    const motivo =
      provedor.decideLocalmente && evento.autorizado !== decisao.autorizado
        ? `${evento.motivo ?? "Decidido no equipamento"} (sistema diria: ${decisao.motivo})`
        : evento.motivo ?? decisao.motivo;

    await prisma.dispositivoAcesso.update({
      where: { id: dispositivoId },
      data: { ultimoContatoEm: new Date() },
    });

    const registrado = await prisma.eventoAcesso.create({
      data: {
        unidadeId: dispositivo.unidadeId,
        dispositivoId,
        credencialId: credencial?.id ?? null,
        alunoId: decisao.alunoId ?? credencial?.alunoId ?? null,
        usuarioId: decisao.usuarioId ?? credencial?.usuarioId ?? null,
        sentido: evento.sentido,
        autorizado,
        motivo,
        ocorridoEm: evento.ocorridoEm,
        provedorEventoId: evento.provedorEventoId ?? null,
        payload: evento.payload as never,
      },
    });

    // Avisa a família que a criança chegou (ou saiu). Deliberadamente FORA
    // do caminho crítico: a catraca precisa responder rápido, e uma falha
    // de WhatsApp não pode impedir o registro do acesso — que é o dado que
    // realmente importa e já está gravado neste ponto.
    await new AvisarAcessoService().execute(registrado.id).catch((erro) => {
      console.warn("[controleAcesso] falha ao avisar acesso por WhatsApp:", erro);
    });

    return registrado;
  }

  private async localizarCredencial(provedorPessoaId?: string | null, referenciaExterna?: string | null) {
    if (provedorPessoaId) {
      const porProvedor = await prisma.credencialAcesso.findFirst({
        where: { provedorPessoaId },
      });

      if (porProvedor) return porProvedor;
    }

    // referenciaExterna é o id que o sistema mandou ao cadastrar a pessoa —
    // fallback pra equipamentos que devolvem só ele no evento.
    const id = Number(referenciaExterna);

    if (Number.isInteger(id) && id > 0) {
      return prisma.credencialAcesso.findFirst({ where: { alunoId: id } });
    }

    return null;
  }
}
