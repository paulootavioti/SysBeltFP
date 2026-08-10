import { prisma } from "../../../shared/database/prisma";
import { EnviarMensagemWhatsappService, type ResultadoEnvio } from "./EnviarMensagemWhatsappService";
import { destinatarioDoAluno, primeiroNome } from "../utils/destinatario";

// Aviso de entrada e saída da criança.
//
// É o recurso que mais tranquiliza pai de criança pequena — e o que mais
// incomoda se vier atrasado, duplicado ou fora de hora. Por isso:
//
// - só dispara em acesso AUTORIZADO. Tentativa negada é assunto da
//   recepção, não do responsável: mandar "acesso negado" pro pai gera
//   susto sem ele poder fazer nada a respeito;
// - o horário é o do evento, não o do envio, pra mensagem não mentir se a
//   fila atrasar;
// - a chave de idempotência é o próprio evento de acesso, então
//   reprocessar a fila não manda dois "chegou".
export class AvisarAcessoService {
  private readonly enviar = new EnviarMensagemWhatsappService();

  async execute(eventoAcessoId: number): Promise<ResultadoEnvio | "IGNORADO"> {
    const evento = await prisma.eventoAcesso.findUnique({
      where: { id: eventoAcessoId },
      select: {
        id: true,
        unidadeId: true,
        alunoId: true,
        sentido: true,
        autorizado: true,
        ocorridoEm: true,
      },
    });

    if (!evento || !evento.alunoId || !evento.autorizado) {
      return "IGNORADO";
    }

    const aluno = await prisma.aluno.findUnique({
      where: { id: evento.alunoId },
      select: { nome: true },
    });

    const destinatario = await destinatarioDoAluno(evento.alunoId);

    if (!aluno || !destinatario) return "SEM_TELEFONE";

    // Catraca é evento do mundo real: o horário exibido é o do relógio da
    // academia (Brasília), não o do fuso de quem lê. Instante de verdade,
    // formatado no fuso da operação.
    const horario = evento.ocorridoEm.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    const { resultado } = await this.enviar.execute({
      unidadeId: evento.unidadeId,
      template: evento.sentido === "ENTRADA" ? "ENTRADA_ALUNO" : "SAIDA_ALUNO",
      parametros: [primeiroNome(aluno.nome), horario],
      telefone: destinatario.telefone,
      alunoId: evento.alunoId,
      responsavelId: destinatario.responsavelId,
      chaveIdempotencia: `acesso-${evento.id}`,
    });

    return resultado;
  }
}
