import { AxiosError } from "axios";

import { lerFila, removerDaFila, type AcaoPendente } from "./filaOffline";

// Só é "sem conexão" quando a request nem chegou a sair (sem response) — um
// 400/403 real da API não deve ficar reenfileirado pra sempre.
export function ehErroDeConexao(erro: unknown) {
  return erro instanceof AxiosError && !erro.response;
}

// Esvazia a fila na ordem em que as ações foram enfileiradas e devolve quantas
// sobraram.
//
// A separação entre "sem conexão" e "erro real" é o ponto todo desta função:
//
// - sem conexão → para de tentar e mantém o resto da fila. Insistir nas
//   próximas só produziria a mesma falha, e desistir perderia o que o
//   professor marcou.
// - erro real (aula finalizada, permissão negada) → descarta a ação. Ela nunca
//   vai ter sucesso, e mantê-la travaria tudo o que veio depois.
//
// Reenviar é seguro: as três ações gravam um estado absoluto (presente
// sim/não, técnica executada sim/não, observação sobrescrita), nunca um
// incremento. Se a resposta se perder depois de o servidor já ter gravado, o
// reenvio chega ao mesmo resultado em vez de duplicar.
export async function sincronizarFila(
  executar: (acao: AcaoPendente) => Promise<unknown>,
): Promise<number> {
  let fila = lerFila();

  for (const acao of fila) {
    try {
      await executar(acao);
      fila = removerDaFila(acao.id);
    } catch (erro) {
      if (ehErroDeConexao(erro)) break;
      fila = removerDaFila(acao.id);
    }
  }

  return fila.length;
}
