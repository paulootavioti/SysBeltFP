import type { AlunoResumo, UsuarioFamilia } from "../contexts/authContextData";

export const CHAVE_USUARIO = "@portalFamilia:usuario";
export const CHAVE_TOKEN = "@portalFamilia:token";
export const CHAVE_ALUNOS = "@portalFamilia:alunos";
export const CHAVE_ALUNO_SELECIONADO = "@portalFamilia:alunoSelecionadoId";

export interface SessaoFamilia {
  usuario: UsuarioFamilia | null;
  token: string | null;
  alunos: AlunoResumo[];
  alunoSelecionadoId: number | null;
}

function lerJson<T>(chave: string): T | null {
  const valor = localStorage.getItem(chave);
  if (!valor) return null;
  try {
    return JSON.parse(valor) as T;
  } catch {
    return null;
  }
}

function lerAlunos(): AlunoResumo[] {
  const bruto = lerJson<unknown>(CHAVE_ALUNOS);
  return Array.isArray(bruto) ? (bruto as AlunoResumo[]) : [];
}

// Decide qual aluno fica selecionado ao restaurar a sessão.
//
// O ponto sensível é o id salvo não valer mais. Um aluno sai da lista do
// responsável quando completa 18 anos — a partir daí só ele mesmo acessa os
// próprios dados. Se a escolha anterior fosse aceita sem conferência, o portal
// abriria pedindo os dados de alguém que aquele responsável não alcança mais.
//
// O backend recusa esse acesso de qualquer forma (`garantirAlunoNoEscopo`), e é
// ele a autoridade. Mas deixar a tela pedir o que vai ser negado transforma uma
// regra de proteção numa tela quebrada, sem explicação para quem está olhando.
export function escolherAlunoSelecionado(
  idSalvo: string | null,
  alunos: AlunoResumo[]
): number | null {
  const id = Number(idSalvo);
  const aindaVinculado =
    idSalvo !== null && Number.isInteger(id) && alunos.some((aluno) => aluno.id === id);

  if (aindaVinculado) return id;

  return alunos[0]?.id ?? null;
}

export function lerSessao(): SessaoFamilia {
  const alunos = lerAlunos();

  return {
    usuario: lerJson<UsuarioFamilia>(CHAVE_USUARIO),
    token: localStorage.getItem(CHAVE_TOKEN),
    alunos,
    alunoSelecionadoId: escolherAlunoSelecionado(
      localStorage.getItem(CHAVE_ALUNO_SELECIONADO),
      alunos
    ),
  };
}

// Escrever `null` remove a chave em vez de deixá-la para trás. Um id órfão
// sobrevivendo a um login sem alunos é justamente o que faria o reload
// restaurar uma seleção que não vale mais.
export function gravarAlunoSelecionado(id: number | null) {
  if (id === null) {
    localStorage.removeItem(CHAVE_ALUNO_SELECIONADO);
    return;
  }
  localStorage.setItem(CHAVE_ALUNO_SELECIONADO, String(id));
}

export function gravarSessao(sessao: {
  usuario: UsuarioFamilia;
  token: string;
  alunos: AlunoResumo[];
  alunoSelecionadoId: number | null;
}) {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(sessao.usuario));
  localStorage.setItem(CHAVE_TOKEN, sessao.token);
  localStorage.setItem(CHAVE_ALUNOS, JSON.stringify(sessao.alunos));
  gravarAlunoSelecionado(sessao.alunoSelecionadoId);
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_USUARIO);
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_ALUNOS);
  localStorage.removeItem(CHAVE_ALUNO_SELECIONADO);
}
