import { useEffect, useState } from "react";

import { TurmaService } from "../../turmas/services/TurmaService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import type { Turma } from "../../turmas/types/turma";

export interface AlunoDoProfessor {
  id: number;
  nome: string;
  faixa: string;
  ativo: boolean;
  turmaId: number;
  turmaNome: string;
}

// Alunos únicos das turmas do professor logado — usado tanto pelo
// seletor do Prontuário quanto pelo formulário de Registrar Graduação,
// que precisam ficar restritos a quem ele efetivamente dá aula.
export function useAlunosDoProfessor(turmas: Turma[]) {
  const [alunos, setAlunos] = useState<AlunoDoProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      if (turmas.length === 0) {
        setAlunos([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro("");

        const detalhes = await Promise.all(turmas.map((turma) => TurmaService.buscar(turma.id)));

        if (cancelado) return;

        const mapa = new Map<number, AlunoDoProfessor>();

        for (const turma of detalhes) {
          for (const aluno of turma.alunos) {
            if (!mapa.has(aluno.id)) {
              mapa.set(aluno.id, {
                id: aluno.id,
                nome: aluno.nome,
                faixa: aluno.faixa,
                ativo: aluno.ativo,
                turmaId: turma.id,
                turmaNome: turma.nome,
              });
            }
          }
        }

        setAlunos(Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (error) {
        if (!cancelado) {
          setErro(getApiErrorMessage(error, "Não foi possível carregar os alunos das suas turmas."));
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmas.map((turma) => turma.id).join(",")]);

  return { alunos, loading, erro };
}
