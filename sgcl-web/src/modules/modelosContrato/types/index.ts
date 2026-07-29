export interface ModeloContrato {
  id: number;
  unidadeId: number;
  nome: string;
  conteudo: string;
  versao: number;
  ativo: boolean;
  modeloOrigemId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export const VARIAVEIS_CONTRATO = [
  { chave: "nomeAluno", descricao: "Nome do aluno" },
  { chave: "nomeResponsavel", descricao: "Nome do responsável (quando o aluno é menor)" },
  { chave: "nomeContratante", descricao: "Nome de quem assina (aluno ou responsável)" },
  { chave: "cpf", descricao: "CPF do contratante" },
  { chave: "endereco", descricao: "Endereço do contratante" },
  { chave: "unidade", descricao: "Nome da unidade" },
  { chave: "professor", descricao: "Nome do professor da turma do aluno" },
  { chave: "plano", descricao: "Nome do plano contratado" },
  { chave: "valor", descricao: "Valor do contrato (formatado em R$)" },
  { chave: "vencimento", descricao: "Data de término da vigência" },
  { chave: "data", descricao: "Data de emissão do contrato" },
] as const;
