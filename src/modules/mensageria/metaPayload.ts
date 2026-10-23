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

// O corpo vem da Meta (entrada externa): cada nível é tratado como
// desconhecido e só vira string quando de fato é string.
type Objeto = Record<string, unknown>;
const objeto = (valor: unknown): Objeto => valor !== null && typeof valor === "object" ? valor as Objeto : {};
const lista = (valor: unknown): unknown[] => Array.isArray(valor) ? valor : [];
const texto = (valor: unknown): string | undefined => typeof valor === "string" ? valor : undefined;

export function extrairIdentificadorConta(tipo: TipoCanalExterno, corpo: unknown): string | null {
  const entrada = objeto(lista(objeto(corpo).entry)[0]);
  if (tipo === "INSTAGRAM") return texto(entrada.id) ?? null;
  const valor = objeto(objeto(lista(entrada.changes)[0]).value);
  return texto(objeto(valor.metadata).phone_number_id) ?? null;
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
  for (const itemEntrada of lista(objeto(corpo).entry)) {
    const entrada = objeto(itemEntrada);
    if (tipo === "WHATSAPP") {
      for (const alteracao of lista(entrada.changes)) {
        const valor = objeto(objeto(alteracao).value);
        const nomes = new Map(lista(valor.contacts).map((c) => {
          const contato = objeto(c);
          return [String(contato.wa_id), objeto(contato.profile).name] as const;
        }));
        for (const item of lista(valor.messages)) {
          const mensagem = objeto(item);
          if (!mensagem.id || !mensagem.from) continue;
          const midia = objeto(mensagem[String(mensagem.type)]);
          resultado.push({
            eventoExternoId: String(mensagem.id), contatoExternoId: String(mensagem.from),
            contatoNome: String(nomes.get(String(mensagem.from)) ?? "").trim() || undefined,
            conteudo: mensagem.type === "text" ? texto(objeto(mensagem.text).body) : texto(midia.caption),
            tipoConteudo: tipoConteudo(mensagem.type), enviadaEm: dataMeta(mensagem.timestamp), payload: mensagem,
            mediaExternaId: texto(midia.id),
            arquivoNome: texto(midia.filename),
          });
        }
      }
      continue;
    }
    for (const item of lista(entrada.messaging)) {
      const evento = objeto(item);
      const mensagem = objeto(evento.message);
      const remetente = objeto(evento.sender);
      if (!mensagem.mid || !remetente.id) continue;
      const anexo = objeto(lista(mensagem.attachments)[0]);
      const payloadAnexo = objeto(anexo.payload);
      resultado.push({
        eventoExternoId: String(mensagem.mid), contatoExternoId: String(remetente.id),
        conteudo: texto(mensagem.text),
        tipoConteudo: mensagem.text ? "TEXTO" : anexo.type ? tipoConteudo(anexo.type) : "DESCONHECIDO",
        enviadaEm: dataMeta(evento.timestamp ? Number(evento.timestamp) / 1_000 : undefined), payload: evento,
        mediaUrlOrigem: texto(payloadAnexo.url),
      });
    }
  }
  return resultado;
}
