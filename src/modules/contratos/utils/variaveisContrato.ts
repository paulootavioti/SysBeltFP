// Variáveis dinâmicas disponíveis nos modelos de contrato — usadas tanto
// pra substituição real (gerarConteudo) quanto pra listar as opções na
// tela de edição do modelo. Formato: {{variavel}}.
export const VARIAVEIS_CONTRATO = [
  { chave: "nomeAluno", descricao: "Nome do aluno" },
  { chave: "nomeResponsavel", descricao: "Nome do responsável (contratante, quando o aluno é menor)" },
  { chave: "nomeContratante", descricao: "Nome de quem assina o contrato (aluno ou responsável)" },
  { chave: "cpf", descricao: "CPF do contratante" },
  { chave: "endereco", descricao: "Endereço do contratante" },
  { chave: "unidade", descricao: "Nome da unidade" },
  { chave: "professor", descricao: "Nome do professor da turma do aluno" },
  { chave: "plano", descricao: "Nome do plano contratado" },
  { chave: "valor", descricao: "Valor do contrato (formatado em R$)" },
  { chave: "vencimento", descricao: "Data de término da vigência" },
  { chave: "data", descricao: "Data de emissão do contrato" },
] as const;

export interface DadosSubstituicaoContrato {
  nomeAluno: string;
  nomeResponsavel?: string | null;
  nomeContratante: string;
  cpf?: string | null;
  endereco?: string | null;
  unidade: string;
  professor?: string | null;
  plano?: string | null;
  valor: number;
  vencimento?: Date | null;
  data: Date;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data?: Date | null): string {
  if (!data) return "Indeterminado";
  return data.toLocaleDateString("pt-BR");
}

// Substitui {{variavel}} pelo valor correspondente; variáveis sem valor
// disponível viram "Não informado" (nunca deixa o placeholder cru no
// texto final do contrato).
export function substituirVariaveisContrato(conteudo: string, dados: DadosSubstituicaoContrato): string {
  const valores: Record<string, string> = {
    nomeAluno: dados.nomeAluno,
    nomeResponsavel: dados.nomeResponsavel || "Não informado",
    nomeContratante: dados.nomeContratante,
    cpf: dados.cpf || "Não informado",
    endereco: dados.endereco || "Não informado",
    unidade: dados.unidade,
    professor: dados.professor || "Não informado",
    plano: dados.plano || "Não informado",
    valor: formatarMoeda(dados.valor),
    vencimento: formatarData(dados.vencimento),
    data: formatarData(dados.data),
  };

  return conteudo.replace(/{{\s*(\w+)\s*}}/g, (match, chave: string) => {
    return chave in valores ? valores[chave] : match;
  });
}

export function montarEndereco(dados: {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}): string | null {
  const partes = [
    dados.logradouro && dados.numero ? `${dados.logradouro}, ${dados.numero}` : dados.logradouro,
    dados.bairro,
    dados.cidade && dados.uf ? `${dados.cidade}/${dados.uf}` : dados.cidade,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" - ") : null;
}
