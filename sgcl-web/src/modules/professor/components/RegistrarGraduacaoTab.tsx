import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";

import { useToast } from "../../../contexts/toast/useToast";
import { useAlunosDoProfessor } from "../hooks/useAlunosDoProfessor";
import { GraduacaoService } from "../../graduacoes/services/GraduacaoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import type { AlunoElegivel } from "../../graduacoes/types";
import type { Turma } from "../../turmas/types/turma";

interface RegistrarGraduacaoTabProps {
  turmas: Turma[];
}

export function RegistrarGraduacaoTab({ turmas }: RegistrarGraduacaoTabProps) {
  const toast = useToast();
  const { alunos, loading: carregandoAlunos, erro: erroAlunos } = useAlunosDoProfessor(turmas);

  const [progresso, setProgresso] = useState<AlunoElegivel[]>([]);
  const [carregandoProgresso, setCarregandoProgresso] = useState(true);
  const [alunoId, setAlunoId] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    GraduacaoService.listarProgressoGraduacoes()
      .then(setProgresso)
      .catch(() => setProgresso([]))
      .finally(() => setCarregandoProgresso(false));
  }, []);

  const idsDosAlunos = useMemo(() => new Set(alunos.map((aluno) => aluno.id)), [alunos]);

  const candidatos = useMemo(
    () => progresso.filter((item) => idsDosAlunos.has(item.alunoId)),
    [progresso, idsDosAlunos]
  );

  const opcoesAluno = candidatos.map((item) => ({
    label: `${item.nome} — ${item.faixa}${item.proximaFaixa ? ` → ${item.proximaFaixa}` : ""}`,
    value: String(item.alunoId),
  }));

  const candidatoSelecionado = candidatos.find((item) => String(item.alunoId) === alunoId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!candidatoSelecionado || !candidatoSelecionado.proximaFaixa) return;

    try {
      setEnviando(true);
      setErro("");

      await GraduacaoService.solicitar({
        alunoId: candidatoSelecionado.alunoId,
        faixa: candidatoSelecionado.proximaFaixa,
        comentario: comentario.trim() || undefined,
      });

      toast.success("Solicitação enviada. Aguarde a aprovação do Admin.");
      setAlunoId("");
      setComentario("");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível enviar a solicitação de graduação."));
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoAlunos || carregandoProgresso) return <Loading />;
  if (erroAlunos) return <ErrorMessage message={erroAlunos} />;

  if (candidatos.length === 0) {
    return (
      <EmptyState
        title="Nenhum aluno disponível"
        description="Você ainda não tem alunos vinculados às suas turmas."
      />
    );
  }

  return (
    <form className="professor-graduacao-form" onSubmit={handleSubmit}>
      <p className="professor-graduacao-aviso">
        A solicitação fica pendente até um Admin aprovar — o aluno só é promovido depois disso.
      </p>

      <Select
        label="Aluno"
        options={opcoesAluno}
        value={alunoId}
        onChange={(e) => setAlunoId(e.target.value)}
        required
      />

      {candidatoSelecionado && (
        <div className="professor-graduacao-resumo">
          {candidatoSelecionado.proximaFaixa ? (
            <p>
              Nova faixa: <strong>{candidatoSelecionado.proximaFaixa}</strong>
            </p>
          ) : (
            <p>Este aluno já está na última faixa da trilha dele.</p>
          )}
          <p>{candidatoSelecionado.presencas} presenças registradas.</p>
        </div>
      )}

      <Textarea
        label="Comentário"
        placeholder="Observações sobre a graduação (opcional)..."
        rows={4}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      <ErrorMessage message={erro} />

      <Button type="submit" disabled={!candidatoSelecionado?.proximaFaixa || enviando}>
        {enviando ? "Enviando..." : "Solicitar graduação"}
      </Button>
    </form>
  );
}
