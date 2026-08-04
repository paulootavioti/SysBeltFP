import { useEffect, useState } from "react";

import { AcademicoService } from "../services/AcademicoService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { TurmaResumo, AlunoDoProfessor } from "../types-academico";

// Alunos únicos das turmas do professor logado — usado pelo seletor do
// Prontuário e pelo formulário de Graduação, restritos a quem ele
// efetivamente dá aula.
export function useAlunosDoProfessor(turmas: TurmaResumo[]) {
  const [alunos, setAlunos] = useState<AlunoDoProfessor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      if (turmas.length === 0) {
        setAlunos([]);
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        setErro("");

        const detalhes = await Promise.all(turmas.map((turma) => AcademicoService.buscarTurma(turma.id)));

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
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmas.map((turma) => turma.id).join(",")]);

  return { alunos, carregando, erro };
}
