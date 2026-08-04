import { useEffect, useMemo, useState, type FormEvent } from "react";

import { SubHeader } from "../../../../components/ui/SubHeader";
import { Textarea } from "../../../../components/ui/Textarea";
import { Button } from "../../../../components/ui/Button";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { useMinhasTurmas } from "../../hooks/useMinhasTurmas";
import { useAlunosDoProfessor } from "../../hooks/useAlunosDoProfessor";
import { AcademicoService } from "../../services/AcademicoService";
import { getApiErrorMessage } from "../../../../utils/getApiErrorMessage";
import type { AlunoElegivel } from "../../types-academico";

import "./styles.css";

export function Graduacoes() {
  const { turmas, carregando: carregandoTurmas, erro: erroTurmas } = useMinhasTurmas();
  const { alunos, carregando: carregandoAlunos, erro: erroAlunos } = useAlunosDoProfessor(turmas);

  const [progresso, setProgresso] = useState<AlunoElegivel[]>([]);
  const [carregandoProgresso, setCarregandoProgresso] = useState(true);
  const [alunoId, setAlunoId] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    AcademicoService.listarProgressoGraduacoes()
      .then(setProgresso)
      .catch(() => setProgresso([]))
      .finally(() => setCarregandoProgresso(false));
  }, []);

  const idsDosAlunos = useMemo(() => new Set(alunos.map((aluno) => aluno.id)), [alunos]);

  const candidatos = useMemo(
    () => progresso.filter((item) => idsDosAlunos.has(item.alunoId)),
    [progresso, idsDosAlunos]
  );

  const candidatoSelecionado = candidatos.find((item) => String(item.alunoId) === alunoId);

  const carregando = carregandoTurmas || carregandoAlunos || carregandoProgresso;
  const erro = erroTurmas || erroAlunos;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!candidatoSelecionado?.proximaFaixa) return;

    try {
      setEnviando(true);
      setErroEnvio("");
      setSucesso("");

      await AcademicoService.solicitarGraduacao({
        alunoId: candidatoSelecionado.alunoId,
        faixa: candidatoSelecionado.proximaFaixa,
        comentario: comentario.trim() || undefined,
      });

      setSucesso("Solicitação enviada. Aguarde a aprovação do Admin.");
      setAlunoId("");
      setComentario("");
    } catch (error) {
      setErroEnvio(getApiErrorMessage(error, "Não foi possível enviar a solicitação de graduação."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="graduacoes-page">
      <SubHeader titulo="Graduações" subtitulo="Solicitar/consultar" />

      <main className="graduacoes-conteudo">
        {carregando && <Loading message="Carregando alunos elegíveis..." />}

        {!carregando && erro && <ErrorMessage message={erro} />}

        {!carregando && !erro && candidatos.length === 0 && (
          <EmptyState
            title="Nenhum aluno disponível"
            description="Você ainda não tem alunos vinculados às suas turmas."
          />
        )}

        {!carregando && !erro && candidatos.length > 0 && (
          <>
            <div className="graduacoes-lista">
              {candidatos.map((candidato) => (
                <button
                  key={candidato.alunoId}
                  type="button"
                  className={`graduacao-item${String(candidato.alunoId) === alunoId ? " graduacao-item-ativo" : ""}`}
                  onClick={() => setAlunoId(String(candidato.alunoId))}
                  disabled={!candidato.proximaFaixa}
                >
                  <div>
                    <strong>{candidato.nome}</strong>
                    <span>
                      {candidato.faixa}
                      {candidato.proximaFaixa ? ` → ${candidato.proximaFaixa}` : " · última faixa da trilha"}
                    </span>
                  </div>
                  <span className="graduacao-item-presencas">{candidato.presencas} presenças</span>
                </button>
              ))}
            </div>

            {candidatoSelecionado?.proximaFaixa && (
              <form className="graduacoes-form" onSubmit={handleSubmit}>
                <p className="graduacoes-aviso">
                  A solicitação fica pendente até um Admin aprovar — o aluno só é promovido depois disso.
                </p>

                <div className="graduacoes-resumo">
                  <p>
                    <strong>{candidatoSelecionado.nome}</strong>
                  </p>
                  <p>
                    Nova faixa: <strong>{candidatoSelecionado.proximaFaixa}</strong>
                  </p>
                </div>

                <Textarea
                  label="Comentário (opcional)"
                  placeholder="Observações sobre a graduação..."
                  rows={4}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />

                <ErrorMessage message={erroEnvio} />
                {sucesso && <p className="graduacoes-sucesso">{sucesso}</p>}

                <Button type="submit" disabled={enviando} className="graduacoes-botao">
                  {enviando ? "Enviando..." : "Solicitar graduação"}
                </Button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
