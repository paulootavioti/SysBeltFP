export interface MensagemFamilia {
  id: number;
  alunoId: number;
  remetenteTipo: "FAMILIA" | "ACADEMIA";
  remetenteNome: string;
  texto: string;
  createdAt: string;
}

export interface ConversaFamiliaResumo {
  aluno: { id: number; nome: string; apelido: string | null; fotoUrl: string | null };
  ultimaMensagem: string;
  ultimaMensagemEm: string;
  ultimoRemetenteTipo: "FAMILIA" | "ACADEMIA";
  naoLidas: number;
}
