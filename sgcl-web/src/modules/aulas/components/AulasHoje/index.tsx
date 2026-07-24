import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../../components/ui/Button";
import { Loading } from "../../../../components/ui/Loading";
import { AulaService } from "../../services/AulaService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { ItemGradeSemanal } from "../../types";

import "./styles.css";

export function AulasHoje() {
  const navigate = useNavigate();

  const [itens, setItens] = useState<ItemGradeSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [iniciandoId, setIniciandoId] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        const grade = await AulaService.gradeSemanal();

        const hoje = new Date().getDay();
        const doDia = grade
          .filter((item) => item.diaSemana === hoje && item.status === "AGENDADA")
          .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

        if (ativo) setItens(doDia);
      } catch {
        if (ativo) setErro("Não foi possível carregar as aulas de hoje.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  async function handleIniciar(id: number) {
    try {
      setIniciandoId(id);
      const aula = await AulaService.iniciarProgramada(id);
      navigate(`/aulas/${aula.id}/chamada`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao iniciar aula."));
      setIniciandoId(null);
    }
  }

  if (loading) {
    return (
      <div className="aulas-hoje">
        <h2>Aulas de Hoje</h2>
        <Loading />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="aulas-hoje">
        <h2>Aulas de Hoje</h2>
        <p className="aulas-hoje-vazio">{erro}</p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="aulas-hoje">
        <h2>Aulas de Hoje</h2>
        <p className="aulas-hoje-vazio">Nenhuma aula programada para hoje.</p>
      </div>
    );
  }

  return (
    <div className="aulas-hoje">
      <h2>Aulas de Hoje</h2>

      <div className="aulas-hoje-lista">
        {itens.map((item) => (
          <div key={item.id} className="aulas-hoje-item">
            <div className="aulas-hoje-item-info">
              <strong>{item.horarioInicio}</strong>
              <span>{item.turmaNome}</span>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => handleIniciar(item.id)}
              disabled={iniciandoId === item.id}
            >
              {iniciandoId === item.id ? "Iniciando..." : "Iniciar Aula"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
