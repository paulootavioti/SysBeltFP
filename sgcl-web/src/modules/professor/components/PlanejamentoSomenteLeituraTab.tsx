import { useEffect, useMemo, useState } from "react";

import { Select } from "../../../components/ui/Select";
import { Badge } from "../../../components/ui/Badge";
import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";

import { CurriculoService } from "../../curriculos/services/CurriculoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { TrilhaFaixasModulos } from "../../curriculos/components/TrilhaFaixasModulos";
import { ModuloSomenteLeituraCard } from "./ModuloSomenteLeituraCard";

import type { Curriculo } from "../../curriculos/types/curriculo";
import type { Turma } from "../../turmas/types/turma";

import "../../curriculos/pages/Listar/styles.css";

interface PlanejamentoSomenteLeituraTabProps {
  turmas: Turma[];
  turmaSelecionada: Turma | null;
}

export function PlanejamentoSomenteLeituraTab({ turmas, turmaSelecionada }: PlanejamentoSomenteLeituraTabProps) {
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [curriculoId, setCurriculoId] = useState<string>("");
  const [modulosAbertos, setModulosAbertos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    CurriculoService.listar()
      .then(setCurriculos)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar o planejamento pedagógico.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (turmaSelecionada?.curriculoId) {
      setCurriculoId(String(turmaSelecionada.curriculoId));
    }
  }, [turmaSelecionada]);

  const opcoesTurma = useMemo(
    () =>
      turmas
        .filter((turma) => turma.curriculoId)
        .map((turma) => ({ label: `${turma.nome} (${turma.curriculo?.nome ?? "Currículo"})`, value: String(turma.curriculoId) })),
    [turmas]
  );

  const curriculoSelecionado = curriculos.find((curriculo) => String(curriculo.id) === curriculoId);

  function alternarModulo(id: number) {
    setModulosAbertos((atual) => ({ ...atual, [id]: !(atual[id] ?? false) }));
  }

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;

  return (
    <div className="professor-planejamento">
      <div className="professor-planejamento-topo">
        <Select
          label="Turma"
          options={opcoesTurma}
          value={curriculoId}
          onChange={(e) => setCurriculoId(e.target.value)}
        />

        <Badge variant="info">Somente leitura</Badge>
      </div>

      {!curriculoSelecionado ? (
        <EmptyState
          title="Selecione uma turma"
          description="Escolha uma das suas turmas para ver o currículo vinculado a ela."
        />
      ) : (
        <div className="curriculo-card">
          <div className="curriculo-card-header">
            <div>
              <h2>{curriculoSelecionado.nome}</h2>
              <p>
                {curriculoSelecionado.modalidade} — {curriculoSelecionado.publico}
              </p>
            </div>
          </div>

          <TrilhaFaixasModulos modulos={curriculoSelecionado.modulos} />

          {curriculoSelecionado.modulos.length === 0 ? (
            <p className="curriculos-vazio">Nenhum módulo cadastrado.</p>
          ) : (
            curriculoSelecionado.modulos.map((modulo) => (
              <ModuloSomenteLeituraCard
                key={modulo.id}
                modulo={modulo}
                expandido={modulosAbertos[modulo.id] ?? false}
                onToggle={() => alternarModulo(modulo.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
