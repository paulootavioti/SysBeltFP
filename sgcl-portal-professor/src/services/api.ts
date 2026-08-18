import axios from "axios";

import { criarInterceptorDeExpiracao } from "../utils/expiracaoDeSessao";

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:3333" : "/api");

export const api = axios.create({
  baseURL,
});

// O interceptor é registrado uma vez, aqui. Quem reage à expiração é definido
// depois pelo AuthContext — ele é quem sabe limpar a sessão, e importá-lo
// deste arquivo criaria um ciclo, já que o contexto usa a `api`.
let aoExpirarSessao: () => void = () => {};

export function registrarExpiracaoDeSessao(callback: () => void) {
  aoExpirarSessao = callback;
}

api.interceptors.response.use(
  (resposta) => resposta,
  criarInterceptorDeExpiracao(() => aoExpirarSessao())
);
