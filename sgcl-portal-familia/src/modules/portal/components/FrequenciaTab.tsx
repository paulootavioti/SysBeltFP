import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";

import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { Frequencia } from "../types";

interface FrequenciaTabProps {
  alunoId: number;
}

export function FrequenciaTab({ alunoId }: FrequenciaTabProps) {
  const [registros, setRegistros] = useState<Frequencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    PortalService.frequencia(alunoId)
      .then(setRegistros)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar a frequência.")))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;

  if (registros.length === 0) {
    return <EmptyState title="Nenhum registro" description="Ainda não há presenças registradas." />;
  }

  return (
    <div className="frequencia-tab-lista">
      {registros.map((registro) => (
        <div key={registro.id} className="frequencia-tab-item">
          <div>
            <strong>{new Date(registro.data).toLocaleDateString("pt-BR")}</strong>
            {registro.turmaNome && <span> — {registro.turmaNome}</span>}
          </div>

          <Badge variant={registro.presente ? "success" : "danger"}>
            {registro.presente ? "Presente" : "Falta"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
