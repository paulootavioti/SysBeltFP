import { createHmac, timingSafeEqual } from "crypto";

// Um <img src="..."> nunca manda header Authorization — o navegador faz um
// GET simples. Por isso servir foto atrás do ensureAuthenticated devolvia 401
// em toda imagem exibida com <img> (foto do treino no Portal da Família, no
// Portal do Professor e na Chamada).
//
// A saída é assinar a própria URL: quem já está autenticado recebe do backend
// um link com validade curta, e a rota de leitura confere a assinatura em vez
// de exigir o header. Mesma ideia de "signed URL" de S3/GCS.
//
// A assinatura cobre a chave do arquivo + o instante de expiração, então o
// link não serve pra outro arquivo nem sobrevive ao prazo.

const VALIDADE_PADRAO_SEGUNDOS = 60 * 60 * 6;

function segredo() {
  // reaproveita o JWT_SECRET: é o segredo forte que o projeto já exige em
  // todo ambiente (ver .env.example), evitando mais uma variável obrigatória.
  const valor = process.env.JWT_SECRET;

  if (!valor) {
    throw new Error("JWT_SECRET não configurado — necessário para assinar as URLs de foto.");
  }

  return valor;
}

function calcularAssinatura(chave: string, expiraEm: number) {
  return createHmac("sha256", segredo()).update(`${chave}:${expiraEm}`).digest("hex");
}

/**
 * Recebe a url guardada no banco ("/uploads/treinos/x.png") e devolve a mesma
 * url com `exp` e `sig` na query string. Urls absolutas (http/https) passam
 * intactas — são de storage externo e não usam esta rota.
 */
export function assinarUrlFoto(url: string, validadeSegundos = VALIDADE_PADRAO_SEGUNDOS) {
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }

  const chave = url.replace(/^\/uploads\//, "");
  const expiraEm = Math.floor(Date.now() / 1000) + validadeSegundos;

  return `${url}?exp=${expiraEm}&sig=${calcularAssinatura(chave, expiraEm)}`;
}

/** Confere assinatura e prazo. Não lança: devolve só true/false. */
export function urlFotoAssinadaValida(chave: string, exp: unknown, sig: unknown) {
  const expiraEm = Number(exp);

  if (!Number.isInteger(expiraEm) || typeof sig !== "string" || sig.length === 0) {
    return false;
  }

  if (expiraEm < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const esperada = Buffer.from(calcularAssinatura(chave, expiraEm));
  const recebida = Buffer.from(sig);

  // timingSafeEqual exige o mesmo tamanho — comparar antes evita a exceção e
  // já descarta assinatura de tamanho errado.
  if (esperada.length !== recebida.length) {
    return false;
  }

  return timingSafeEqual(esperada, recebida);
}
