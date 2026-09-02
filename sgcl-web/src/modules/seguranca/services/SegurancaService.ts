import { api } from "../../../services/api";

export type EstadoSeguranca = {
  doisFatoresAtivo: boolean;
  doisFatoresAtivadoEm: string | null;
  configuracaoPendente: boolean;
};

export const SegurancaService = {
  obter: () => api.get<EstadoSeguranca>("/usuarios/minha-seguranca").then((r) => r.data),
  iniciar: () => api.post<{ segredo: string; uri: string }>("/usuarios/minha-seguranca/2fa/iniciar").then((r) => r.data),
  confirmar: (codigo: string) => api.post("/usuarios/minha-seguranca/2fa/confirmar", { codigo }),
  desativar: (senha: string, codigo: string) => api.post("/usuarios/minha-seguranca/2fa/desativar", { senha, codigo }),
};
