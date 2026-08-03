export type StatusLead = "NOVO" | "CONTACTADO" | "CONVERTIDO";

export const STATUS_LEAD_LABEL: Record<StatusLead, string> = {
  NOVO: "Novo",
  CONTACTADO: "Contactado",
  CONVERTIDO: "Convertido",
};

export interface Lead {
  id: number;
  nome: string;
  contato: string;
  interesse: string;
  status: StatusLead;
  criadoEm: string;
}
