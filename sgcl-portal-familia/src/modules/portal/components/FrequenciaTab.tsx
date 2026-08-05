import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { GraficoAproveitamento } from "./GraficoAproveitamento";

import { resolverUrlUpload } from "../../../utils/resolverUrlUpload";
import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { Frequencia, FotoTreinoFrequencia } from "../types";

interface FrequenciaTabProps {
  alunoId: number;
}

export function FrequenciaTab({ alunoId }: FrequenciaTabProps) {
  const [registros, setRegistros] = useState<Frequencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [fotoAberta, setFotoAberta] = useState<FotoTreinoFrequencia | null>(null);

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
    <div className="frequencia-tab-conteudo">
      <GraficoAproveitamento registros={registros} />

      <div className="frequencia-tab-lista">
        {registros.map((registro) => (
          <div key={registro.id} className="frequencia-tab-item">
            <div className="frequencia-tab-item-linha">
              <div>
                <strong>{new Date(registro.data).toLocaleDateString("pt-BR")}</strong>
                {registro.turmaNome && <span> — {registro.turmaNome}</span>}
              </div>

              <Badge variant={registro.presente ? "success" : "danger"}>
                {registro.presente ? "Presente" : "Falta"}
              </Badge>
            </div>

            {registro.fotos.length > 0 && (
              <div className="frequencia-tab-fotos">
                <span className="frequencia-tab-fotos-aviso">📷 Foto do treino disponível</span>
                {registro.fotos.map((foto) => (
                  <Button
                    key={foto.id}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setFotoAberta(foto)}
                  >
                    Ver foto
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={fotoAberta !== null} title={fotoAberta?.legenda ?? "Foto do treino"} onClose={() => setFotoAberta(null)}>
        {fotoAberta && (
          <div className="frequencia-tab-lightbox">
            <img src={resolverUrlUpload(fotoAberta.url)} alt={fotoAberta.legenda} className="frequencia-tab-lightbox-imagem" />
            <a href={resolverUrlUpload(fotoAberta.url)} download className="frequencia-tab-lightbox-download">
              Baixar foto
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}
