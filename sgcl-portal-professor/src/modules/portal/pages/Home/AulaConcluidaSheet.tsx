import { useEffect, useRef, useState } from "react";

import { BottomSheet } from "../../../../components/ui/BottomSheet";
import { Button } from "../../../../components/ui/Button";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { PortalProfessorService } from "../../services/PortalProfessorService";
import { getApiErrorMessage } from "../../../../utils/getApiErrorMessage";
import { resolverUrlUpload } from "../../../../utils/resolverUrlUpload";
import type { AulaHojeItem, AulaDetalhe, FotoTreino } from "../../types";

import "./AulaConcluidaSheet.css";

interface AulaConcluidaSheetProps {
  item: AulaHojeItem | null;
  onClose: () => void;
}

function diaDaSemana(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", { weekday: "long" });
}

export function AulaConcluidaSheet({ item, onClose }: AulaConcluidaSheetProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [aula, setAula] = useState<AulaDetalhe | null>(null);
  const [fotos, setFotos] = useState<FotoTreino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legenda, setLegenda] = useState("");
  const [visivelNaLanding, setVisivelNaLanding] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  const aulaId = item?.aulaId ?? null;

  useEffect(() => {
    if (!aulaId) return;

    let cancelado = false;
    setCarregando(true);
    setErro("");

    Promise.all([PortalProfessorService.aula(aulaId), PortalProfessorService.listarFotos(aulaId)])
      .then(([detalhe, listaFotos]) => {
        if (cancelado) return;
        setAula(detalhe);
        setFotos(listaFotos);
        setLegenda(`Treino ${item?.horarioInicio ?? ""} · ${diaDaSemana(detalhe.data)}`.trim());
      })
      .catch((error) => {
        if (!cancelado) setErro(getApiErrorMessage(error, "Não foi possível carregar a aula."));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [aulaId, item?.horarioInicio]);

  // libera o object URL da prévia ao trocar de foto ou fechar o painel
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleEscolherArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const escolhido = event.target.files?.[0];
    if (!escolhido) return;

    setArquivo(escolhido);
    setPreview(URL.createObjectURL(escolhido));
    setErroEnvio("");
  }

  function limparSelecao() {
    setArquivo(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleEnviar() {
    if (!arquivo || !aulaId) return;

    try {
      setEnviando(true);
      setErroEnvio("");

      await PortalProfessorService.publicarFoto(aulaId, arquivo, legenda, visivelNaLanding);

      const atualizadas = await PortalProfessorService.listarFotos(aulaId);
      setFotos(atualizadas);
      limparSelecao();
    } catch (error) {
      setErroEnvio(getApiErrorMessage(error, "Não foi possível enviar a foto. Tente novamente."));
    } finally {
      setEnviando(false);
    }
  }

  const presentes = aula?.alunos.filter((registro) => registro.presente).length ?? 0;
  const totalAlunos = aula?.alunos.length ?? 0;
  const tecnicasPlanejadas = aula?.aulaCurriculo?.tecnicas.length ?? 0;
  const tecnicasExecutadas = aula?.tecnicasRealizadas.length ?? 0;

  return (
    <BottomSheet open={!!item} title={item?.turmaNome ?? "Aula concluída"} onClose={onClose}>
      {carregando && <Loading message="Carregando a aula..." />}

      {!carregando && erro && <ErrorMessage message={erro} />}

      {!carregando && !erro && aula && (
        <div className="aula-concluida">
          <p className="aula-concluida-horario">
            {item?.horarioInicio}–{item?.horarioFim} · concluída
          </p>

          <div className="aula-concluida-kpis">
            <div className="aula-concluida-kpi">
              <strong>
                {presentes}/{totalAlunos}
              </strong>
              <span>Presença</span>
            </div>

            <div className="aula-concluida-kpi">
              <strong>
                {tecnicasExecutadas}/{tecnicasPlanejadas}
              </strong>
              <span>Técnicas</span>
            </div>

            <div className="aula-concluida-kpi">
              <strong>{aula.notas.length}</strong>
              <span>Notas</span>
            </div>
          </div>

          {aula.aulaCurriculo && (
            <p className="aula-concluida-plano">
              <strong>Plano:</strong> {aula.aulaCurriculo.titulo}
            </p>
          )}

          {aula.observacoes && (
            <p className="aula-concluida-observacao">
              <strong>Observação da turma:</strong> {aula.observacoes}
            </p>
          )}

          <section className="aula-concluida-secao">
            <h3>Fotos do treino</h3>

            {fotos.length === 0 ? (
              <p className="aula-concluida-vazio">Nenhuma foto publicada nesta aula ainda.</p>
            ) : (
              <div className="aula-concluida-galeria">
                {fotos.map((foto) => (
                  <figure key={foto.id} className="aula-concluida-foto">
                    <img src={resolverUrlUpload(foto.url)} alt={foto.legenda} />
                    {foto.visivelNaLanding && <figcaption>Galeria pública</figcaption>}
                  </figure>
                ))}
              </div>
            )}
          </section>

          <section className="aula-concluida-secao">
            <h3>Adicionar foto</h3>
            <p className="aula-concluida-apoio">
              Dá pra publicar uma foto depois da aula finalizada — vai pras famílias dos alunos presentes.
            </p>

            <button type="button" className="aula-concluida-area" onClick={() => inputRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="Prévia da foto do treino" />
              ) : (
                <span className="aula-concluida-placeholder">
                  <span aria-hidden="true">📷</span>
                  Toque para tirar ou escolher uma foto
                </span>
              )}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="aula-concluida-input-oculto"
              onChange={handleEscolherArquivo}
            />

            {arquivo && (
              <>
                <label className="aula-concluida-campo">
                  <span>Legenda</span>
                  <input type="text" value={legenda} onChange={(e) => setLegenda(e.target.value)} />
                </label>

                <label className="aula-concluida-checkbox">
                  <input
                    type="checkbox"
                    checked={visivelNaLanding}
                    onChange={(e) => setVisivelNaLanding(e.target.checked)}
                  />
                  <span>
                    <strong>Publicar também na galeria pública</strong>
                    <span className="aula-concluida-checkbox-apoio">
                      {visivelNaLanding
                        ? "Vai para a galeria da academia e para as famílias."
                        : "Vai só para as famílias dos alunos presentes."}
                    </span>
                  </span>
                </label>

                <ErrorMessage message={erroEnvio} />

                <div className="aula-concluida-acoes">
                  <Button variant="secondary" onClick={limparSelecao} disabled={enviando}>
                    Cancelar
                  </Button>
                  <Button onClick={handleEnviar} disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar foto"}
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </BottomSheet>
  );
}
