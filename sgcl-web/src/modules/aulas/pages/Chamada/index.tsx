import "./styles.css";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { PageHeader } from "../../../../components/layout/PageHeader";
import { AulaAlunoCard } from "../../components/AulaAlunoCard";
import { Loading } from "../../../../components/ui/Loading";
import { Button } from "../../../../components/ui/Button";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { Modal } from "../../../../components/ui/Modal";
import { Badge } from "../../../../components/ui/Badge";

import { Page } from "../../../../components/sgcl/layout/Page";
import { Section } from "../../../../components/sgcl/layout/Section";
import { InfoCard } from "../../../../components/sgcl/cards/InfoCard";
import { StatusBadge } from "../../../../components/sgcl/feedback/StatusBadge";

import { AulaService } from "../../services/AulaService";

import type { Aula, AulaAluno, TecnicaAulaCurriculo } from "../../types";

function jogosComoLista(jogosSugeridos?: string | null): string[] {
  if (!jogosSugeridos) return [];

  return jogosSugeridos
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0);
}

export function ChamadaAula() {
  const { id } = useParams();

  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const [tecnicaDetalhe, setTecnicaDetalhe] = useState<TecnicaAulaCurriculo | null>(null);
  const [salvandoPlano, setSalvandoPlano] = useState(false);

  useEffect(() => {
    async function carregarAula() {
      if (!id) return;

      const data = await AulaService.buscar(Number(id));

      setAula(data);
      setLoading(false);
    }

    carregarAula();
  }, [id]);

  async function atualizarAluno(
    registro: AulaAluno,
    data: Partial<AulaAluno>
  ) {
    const atualizado = await AulaService.atualizarAluno(
      registro.id,
      data
    );

    setAula((old) => {
      if (!old) return old;

      return {
        ...old,
        alunos: old.alunos.map((item) =>
          item.id === registro.id
            ? {
                ...item,
                ...atualizado,
              }
            : item
        ),
      };
    });

  }

  async function alternarJogo(jogo: string, feito: boolean) {
    if (!aula || salvandoPlano) return;

    const jogosRealizados = feito
      ? [...aula.jogosRealizados, jogo]
      : aula.jogosRealizados.filter((item) => item !== jogo);

    try {
      setSalvandoPlano(true);
      const atualizada = await AulaService.atualizar(aula.id, { jogosRealizados });
      setAula(atualizada);
    } finally {
      setSalvandoPlano(false);
    }
  }

  async function alternarTecnica(tecnicaId: number, feito: boolean) {
    if (!aula || salvandoPlano) return;

    const idsAtuais = aula.tecnicasRealizadas.map((tecnica) => tecnica.id);

    const tecnicasRealizadasIds = feito
      ? [...idsAtuais, tecnicaId]
      : idsAtuais.filter((id) => id !== tecnicaId);

    try {
      setSalvandoPlano(true);
      const atualizada = await AulaService.atualizar(aula.id, { tecnicasRealizadasIds });
      setAula(atualizada);
    } finally {
      setSalvandoPlano(false);
    }
  }

  async function finalizarAula() {
    if (!aula) return;

    await AulaService.finalizar(aula.id);

    const atualizada = await AulaService.buscar(aula.id);

    setAula(atualizada);
  }

  if (loading || !aula) {
    return (
      <Page>
        <Loading />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={`Chamada - ${aula.turma?.nome ?? "Aula"}`}
        subtitle={`Professor: ${aula.professor ?? "-"}`}
      />

        <div className="chamada-info-grid">
          <InfoCard
            title="Turma"
            value={aula.turma?.nome ?? "-"}
          />

          <InfoCard
            title="Professor"
            value={aula.professor ?? "-"}
          />

          <InfoCard
            title="Status"
            value={<StatusBadge status={aula.status} />}
          />
        </div>
        
        {aula.aulaCurriculo && (
        <Section
          title="Plano de Aula"
          description={aula.aulaCurriculo.titulo}
        >
          <div className="chamada-plano">
            {aula.aulaCurriculo.objetivo && (
              <p><strong>🎯 Objetivo:</strong> {aula.aulaCurriculo.objetivo}</p>
            )}

            {jogosComoLista(aula.aulaCurriculo.jogosSugeridos).length > 0 && (
              <div className="chamada-plano-jogos">
                <strong>🎮 Jogos sugeridos:</strong>
                <div className="chamada-plano-jogos-lista">
                  {jogosComoLista(aula.aulaCurriculo.jogosSugeridos).map((jogo) => (
                    <Checkbox
                      key={jogo}
                      label={jogo}
                      checked={aula.jogosRealizados.includes(jogo)}
                      disabled={aula.status === "FINALIZADA" || salvandoPlano}
                      onChange={(event) => alternarJogo(jogo, event.target.checked)}
                    />
                  ))}
                </div>
              </div>
            )}

            {aula.aulaCurriculo.tecnicas.length > 0 && (
              <div className="chamada-plano-tecnicas">
                <strong>Técnicas sugeridas:</strong>
                <div className="chamada-plano-tecnicas-lista">
                  {aula.aulaCurriculo.tecnicas.map((tecnica) => {
                    const realizada = aula.tecnicasRealizadas.some((item) => item.id === tecnica.id);

                    return (
                      <div key={tecnica.id} className="chamada-plano-tecnica-linha">
                        <Checkbox
                          label=""
                          checked={realizada}
                          disabled={aula.status === "FINALIZADA" || salvandoPlano}
                          onChange={(event) => alternarTecnica(tecnica.id, event.target.checked)}
                        />

                        <button
                          type="button"
                          className="chamada-plano-tecnica-botao"
                          onClick={() => setTecnicaDetalhe(tecnica)}
                        >
                          <Badge variant={tecnica.obrigatoria ? "info" : "neutral"}>
                            {tecnica.nome}
                          </Badge>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

    <Section
      title="Chamada"
      description="Marque presença e comportamento dos alunos."
    >
      {aula.alunos.map((registro) => (
        <AulaAlunoCard
          key={registro.id}
          registro={registro}
          aulaFinalizada={aula.status === "FINALIZADA"}
          dataAula={aula.data}
          onChange={atualizarAluno}
        />
      ))}

    </Section>

      {aula.status === "ABERTA" && (
        <Button type="button" onClick={finalizarAula}>
          Finalizar Aula
        </Button>
      )}

      <Modal
        open={tecnicaDetalhe !== null}
        title={tecnicaDetalhe?.nome ?? ""}
        onClose={() => setTecnicaDetalhe(null)}
      >
        {tecnicaDetalhe && (
          <div className="chamada-tecnica-detalhe">
            <div className="chamada-tecnica-detalhe-tags">
              <Badge variant={tecnicaDetalhe.obrigatoria ? "info" : "neutral"}>
                {tecnicaDetalhe.obrigatoria ? "Obrigatória" : "Opcional"}
              </Badge>

              {tecnicaDetalhe.categoria && <Badge variant="neutral">{tecnicaDetalhe.categoria}</Badge>}
            </div>

            <p>
              {tecnicaDetalhe.descricao || "Nenhuma descrição cadastrada para esta técnica."}
            </p>
          </div>
        )}
      </Modal>

    </Page>

  );
}