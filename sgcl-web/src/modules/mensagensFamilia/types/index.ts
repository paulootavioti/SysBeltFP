export interface MensagemFamilia {
  id: number;
  alunoId: number;
  remetenteTipo: "FAMILIA" | "ACADEMIA";
  remetenteNome: string;
  texto: string;
  createdAt: string;
}
