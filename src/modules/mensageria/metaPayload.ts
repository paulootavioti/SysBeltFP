import type { TipoCanalExterno } from "../../shared/tenant/MensageriaDirectory";

export interface MensagemMetaNormalizada {
  eventoExternoId: string;
  contatoExternoId: string;
  contatoNome?: string;
  conteudo?: string;
  tipoConteudo: "TEXTO" | "IMAGEM" | "AUDIO" | "VIDEO" | "DOCUMENTO" | "LOCALIZACAO" | "CONTATO" | "REACAO" | "DESCONHECIDO";
  enviadaEm: string;
  mediaExternaId?: string;
  mediaUrlOrigem?: string;
  arquivoNome?: string;
  payload: Record<string, unknown>;
}

type Objeto = Record<string, any>;
const objeto = (valor: unknown): Objeto => valor !== null && typeof valor === "object" ? valor as Objeto : {};

export function extrairIdentificadorConta(tipo: TipoCanalExterno, corpo: unknown): string | null {
  const entrada = objeto(objeto(corpo).entry?.[0]);
  if (tipo === "INSTAGRAM") return typeof entrada.id === "string" ? entrada.id : null;
  const valor = objeto(objeto(entrada.changes?.[0]).value);
  return typeof objeto(valor.metadata).phone_number_id === "string" ? valor.metadata.phone_number_id : null;
}

function dataMeta(timestamp: unknown): string {
  const segundos = Number(timestamp);
  const data = Number.isFinite(segundos) ? new Date(segundos * 1_000) : new Date();
  return data.toISOString();
}

function tipoConteudo(tipo: unknown): MensagemMetaNormalizada["tipoConteudo"] {
  const mapa: Record<string, MensagemMetaNormalizada["tipoConteudo"]> = {
    text: "TEXTO", image: "IMAGEM", audio: "AUDIO", video: "VIDEO", document: "DOCUMENTO",
    location: "LOCALIZACAO", contacts: "CONTATO", reaction: "REACAO",
  };
  return mapa[String(tipo)] ?? "DESCONHECIDO";
}

export function normalizarMensagensMeta(tipo: TipoCanalExterno, corpo: unknown): MensagemMetaNormalizada[] {
  const resultado: MensagemMetaNormalizada[] = [];
  for (const itemEntrada of objeto(corpo).entry ?? []) {
    const entrada = objeto(itemEntrada);
    if (tipo === "WHATSAPP") {
      for (const alteracao of entrada.changes ?? []) {
        const valor = objeto(objeto(alteracao).value);
        const nomes = new Map((valor.contacts ?? []).map((c: unknown) => {
          const contato = objeto(c);
          return [String(contato.wa_id), objeto(contato.profile).name] as const;
        }));
        for (const item of valor.messages ?? []) {
          const mensagem = objeto(item);
          if (!mensagem.id || !mensagem.from) continue;
          const midia = objeto(mensagem[mensagem.type]);
          resultado.push({
            eventoExternoId: String(mensagem.id), contatoExternoId: String(mensagem.from),
            contatoNome: String(nomes.get(String(mensagem.from)) ?? "").trim() || undefined,
            conteudo: mensagem.type === "text" ? objeto(mensagem.text).body : typeof midia.caption === "string" ? midia.caption : undefined,
            tipoConteudo: tipoConteudo(mensagem.type), enviadaEm: dataMeta(mensagem.timestamp), payload: mensagem,
            mediaExternaId: typeof midia.id === "string" ? midia.id : undefined,
            arquivoNome: typeof midia.filename === "string" ? midia.filename : undefined,
          });
        }
      }
      continue;
    }
    for (const item of entrada.messaging ?? []) {
      const evento = objeto(item);
      const mensagem = objeto(evento.message);
      if (!mensagem.mid || !objeto(evento.sender).id) continue;
      const anexo = objeto(mensagem.attachments?.[0]);
      const payloadAnexo = objeto(anexo.payload);
      resultado.push({
        eventoExternoId: String(mensagem.mid), contatoExternoId: String(evento.sender.id),
        conteudo: typeof mensagem.text === "string" ? mensagem.text : undefined,
        tipoConteudo: mensagem.text ? "TEXTO" : anexo.type ? tipoConteudo(anexo.type) : "DESCONHECIDO",
        enviadaEm: dataMeta(evento.timestamp ? Number(evento.timestamp) / 1_000 : undefined), payload: evento,
        mediaUrlOrigem: typeof payloadAnexo.url === "string" ? payloadAnexo.url : undefined,
      });
    }
  }
  return resultado;
}
