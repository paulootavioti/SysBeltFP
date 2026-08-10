import { cifrarSeNecessario, decifrar, estaCifrado } from "../../../shared/security/segredos";

// Credenciais de gateway, guardadas POR FORMA DE PAGAMENTO — ou seja, por
// unidade, ou seja, por assinante.
//
// Antes disso elas viviam em variável de ambiente (MERCADO_PAGO_*), o que
// dá um par de credenciais por servidor: uma academia por instalação. Num
// sistema vendido por assinatura, cada cliente precisa plugar a conta dele
// no gateway que ele escolher.
//
// Formato de `FormaPagamento.configuracao`:
//
//   {
//     "gateway": "MERCADO_PAGO",
//     "credenciais": {
//       "accessToken":   "enc:v1:...",
//       "webhookSecret": "enc:v1:..."
//     }
//   }
//
// Os valores dentro de `credenciais` ficam sempre cifrados em repouso
// (ver src/shared/security/segredos.ts) e NUNCA saem numa resposta de API
// — quem monta resposta usa `resumirConfiguracao`.

export interface CredenciaisGateway {
  accessToken: string;
  webhookSecret: string;
}

export interface ConfiguracaoFormaPagamento {
  gateway?: string | null;
  credenciais?: Record<string, string> | null;
}

const CAMPOS_CREDENCIAL = ["accessToken", "webhookSecret"] as const;

export function lerConfiguracao(bruta: unknown): ConfiguracaoFormaPagamento {
  if (!bruta || typeof bruta !== "object" || Array.isArray(bruta)) return {};

  return bruta as ConfiguracaoFormaPagamento;
}

export function nomeDoGateway(bruta: unknown): string | null {
  return lerConfiguracao(bruta).gateway ?? null;
}

/**
 * Credenciais prontas pra uso: decifradas.
 *
 * Enquanto a instalação não tiver migrado, cai nas variáveis de ambiente
 * antigas. Isso é ponte de transição, não desenho: com mais de um
 * assinante no mesmo servidor, o ambiente devolveria a credencial do
 * cliente errado, por isso o aviso.
 */
export function lerCredenciaisGateway(
  bruta: unknown,
  env: NodeJS.ProcessEnv = process.env
): CredenciaisGateway {
  const credenciais = lerConfiguracao(bruta).credenciais ?? {};

  const accessToken = decifrarCampo(credenciais.accessToken, env);
  const webhookSecret = decifrarCampo(credenciais.webhookSecret, env);

  if (accessToken || webhookSecret) {
    return { accessToken: accessToken ?? "", webhookSecret: webhookSecret ?? "" };
  }

  return credenciaisDoAmbiente(env);
}

function decifrarCampo(valor: string | undefined, env: NodeJS.ProcessEnv): string | null {
  if (!valor) return null;

  // Valor não cifrado no banco é dado de instalação antiga (ou edição
  // manual). Aceita, mas não é o caminho normal — ao salvar de novo pela
  // aplicação ele volta cifrado.
  if (!estaCifrado(valor)) return valor;

  return decifrar(valor, env);
}

let avisouUsoDoAmbiente = false;

function credenciaisDoAmbiente(env: NodeJS.ProcessEnv): CredenciaisGateway {
  const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
  const webhookSecret = env.MERCADO_PAGO_WEBHOOK_SECRET ?? "";

  if ((accessToken || webhookSecret) && !avisouUsoDoAmbiente && env.NODE_ENV !== "test") {
    avisouUsoDoAmbiente = true;
    console.warn(
      "[pagamentos] Usando credenciais do Mercado Pago das variáveis de ambiente. " +
        "Isso vale pra UMA academia por servidor — cadastre as credenciais na forma de pagamento da unidade."
    );
  }

  return { accessToken, webhookSecret };
}

/**
 * Prepara a configuração pra gravar: cifra o que veio do formulário e
 * descarta campo em branco (formulário que não mexeu na credencial manda
 * string vazia, e isso não pode apagar a credencial existente).
 */
export function prepararConfiguracaoParaGravar(
  entrada: unknown,
  configuracaoAtual: unknown,
  env: NodeJS.ProcessEnv = process.env
): ConfiguracaoFormaPagamento {
  const nova = lerConfiguracao(entrada);
  const atual = lerConfiguracao(configuracaoAtual);

  const credenciaisAtuais = atual.credenciais ?? {};
  const credenciaisEntrada = nova.credenciais ?? {};
  const resultado: Record<string, string> = { ...credenciaisAtuais };

  for (const campo of CAMPOS_CREDENCIAL) {
    const valor = credenciaisEntrada[campo];

    if (valor === undefined) continue;

    // Vazio explícito = remover a credencial. Ausente = manter a atual.
    if (valor === "") {
      delete resultado[campo];
      continue;
    }

    resultado[campo] = cifrarSeNecessario(valor, env);
  }

  return {
    gateway: nova.gateway !== undefined ? nova.gateway : (atual.gateway ?? null),
    credenciais: Object.keys(resultado).length > 0 ? resultado : null,
  };
}

export interface ResumoConfiguracao {
  gateway: string | null;
  /** Quais credenciais estão cadastradas — nunca os valores. */
  credenciaisConfiguradas: Record<string, boolean>;
}

/**
 * Versão da configuração que PODE sair numa resposta de API: diz qual
 * gateway está ligado e quais credenciais já foram preenchidas, sem
 * revelar nenhuma delas.
 */
export function resumirConfiguracao(bruta: unknown): ResumoConfiguracao {
  const configuracao = lerConfiguracao(bruta);
  const credenciais = configuracao.credenciais ?? {};

  return {
    gateway: configuracao.gateway ?? null,
    credenciaisConfiguradas: Object.fromEntries(
      CAMPOS_CREDENCIAL.map((campo) => [campo, Boolean(credenciais[campo])])
    ),
  };
}
