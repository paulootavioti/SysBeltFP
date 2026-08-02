import { calcularIdade } from "../../mensagens/utils";

interface AlunoParaEscopo {
  id: number;
  nome: string;
  apelido: string | null;
  fotoUrl: string | null;
  dataNascimento: Date;
}

interface ResponsavelParaEscopo {
  nome: string;
  aluno: AlunoParaEscopo;
}

interface CalcularEscopoFamiliaDTO {
  comoAluno: boolean;
  comoResponsavel: boolean;
  alunoProprio: AlunoParaEscopo | null;
  responsaveis: ResponsavelParaEscopo[];
}

export interface EscopoFamilia {
  alunos: AlunoParaEscopo[];
  nome: string;
  tipo: "RESPONSAVEL" | "ALUNO";
}

// Regra de maioridade do Portal da Família: a partir de 18 anos o aluno
// passa a ser responsável por si mesmo — só a própria conta dele acessa
// o portal a partir daí, e qualquer Responsavel vinculado perde acesso a
// esse aluno especificamente. Enquanto menor, só os responsáveis
// acessam — o login direto do próprio aluno fica bloqueado mesmo com
// credencial válida, porque a maioridade é o que "liga" o acesso, não a
// posse da senha.
//
// A mesma pessoa pode logar como aluno maior de idade E, com a mesma
// conta, ser responsável por outro aluno mais novo — nesse caso os dois
// vínculos se somam numa sessão só (por isso "comoAluno" e
// "comoResponsavel" não são mutuamente exclusivos).
//
// A idade é recalculada a cada chamada (login e a cada request
// autenticado) — nunca fica cravada na sessão, então o acesso muda
// automaticamente no exato dia em que o aluno completa 18 anos.
export function calcularEscopoFamilia({
  comoAluno,
  comoResponsavel,
  alunoProprio,
  responsaveis,
}: CalcularEscopoFamiliaDTO): EscopoFamilia {
  const alunosPorId = new Map<number, AlunoParaEscopo>();
  let nome = "";
  let tipo: "RESPONSAVEL" | "ALUNO" = "ALUNO";

  if (comoResponsavel) {
    for (const responsavel of responsaveis) {
      if (calcularIdade(responsavel.aluno.dataNascimento) < 18) {
        alunosPorId.set(responsavel.aluno.id, responsavel.aluno);
        if (!nome) nome = responsavel.nome;
        tipo = "RESPONSAVEL";
      }
    }
  }

  if (comoAluno && alunoProprio && calcularIdade(alunoProprio.dataNascimento) >= 18) {
    alunosPorId.set(alunoProprio.id, alunoProprio);
    if (!nome) nome = alunoProprio.nome;
  }

  return { alunos: Array.from(alunosPorId.values()), nome, tipo };
}
