import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Badge } from "../../../components/ui/Badge";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

import { useAuth } from "../../../contexts/useAuth";
import { useToast } from "../../../contexts/toast/useToast";
import { UploadService } from "../../../shared/services/UploadService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { gerarLegendaTreino } from "../../aulas/utils/legendaTreino";

import { FotosTreinoService } from "../services/FotosTreinoService";
import type { FotoTreino } from "../types";

import "./FotoTreinoBloco.css";
import { resolverUrlUpload } from "../../../shared/utils/resolverUrlUpload";

interface FotoTreinoBlocoProps {
  aulaId: number;
  dataAula: string;
  horarioInicio?: string;
}

export function FotoTreinoBloco({ aulaId, dataAula, horarioInicio }: FotoTreinoBlocoProps) {
  const { usuario } = useAuth();
  const toast = useToast();

  const [fotos, setFotos] = useState<FotoTreino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([]);
  const [urlsEnviadas, setUrlsEnviadas] = useState<string[]>([]);
  const [enviandoArquivos, setEnviandoArquivos] = useState(false);
  const [legenda, setLegenda] = useState(gerarLegendaTreino(dataAula, horarioInicio));
  const [visivelNaLanding, setVisivelNaLanding] = useState(false);
  const [publicando, setPublicando] = useState(false);

  const [fotoParaExcluir, setFotoParaExcluir] = useState<FotoTreino | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function carregarFotos() {
    try {
      setCarregando(true);
      const data = await FotosTreinoService.listar(aulaId);
      setFotos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar fotos do treino."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId]);

  async function handleSelecionarArquivos(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? []);
    if (arquivos.length === 0) return;

    setErro("");
    setEnviandoArquivos(true);

    try {
      const urls: string[] = [];
      for (const arquivo of arquivos) {
        const resultado = await UploadService.enviarFoto(arquivo, "treinos");
        urls.push(resultado.url);
      }

      setArquivosSelecionados((atual) => [...atual, ...arquivos]);
      setUrlsEnviadas((atual) => [...atual, ...urls]);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao enviar foto."));
    } finally {
      setEnviandoArquivos(false);
      event.target.value = "";
    }
  }

  function removerPendente(indice: number) {
    setArquivosSelecionados((atual) => atual.filter((_, i) => i !== indice));
    setUrlsEnviadas((atual) => atual.filter((_, i) => i !== indice));
  }

  async function publicarFotos() {
    if (urlsEnviadas.length === 0) {
      setErro("Selecione ao menos uma foto para publicar.");
      return;
    }

    try {
      setPublicando(true);
      setErro("");

      const resultado = await FotosTreinoService.publicar({
        aulaId,
        urls: urlsEnviadas,
        legenda: legenda.trim(),
        visivelNaLanding,
      });

      toast.success(
        `Foto publicada na galeria e enviada para ${resultado.familiasPresentes} família${
          resultado.familiasPresentes === 1 ? "" : "s"
        } presente${resultado.familiasPresentes === 1 ? "" : "s"}.`
      );

      setArquivosSelecionados([]);
      setUrlsEnviadas([]);
      setLegenda(gerarLegendaTreino(dataAula, horarioInicio));
      setVisivelNaLanding(false);

      await carregarFotos();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao publicar foto.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setPublicando(false);
    }
  }

  async function alternarVisibilidade(foto: FotoTreino) {
    try {
      setErro("");
      await FotosTreinoService.alternarVisibilidade(foto.id);
      await carregarFotos();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao alterar visibilidade da foto.");
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  async function excluirFoto() {
    if (!fotoParaExcluir) return;

    try {
      setExcluindo(true);
      await FotosTreinoService.excluir(fotoParaExcluir.id);
      setFotoParaExcluir(null);
      await carregarFotos();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir foto."));
    } finally {
      setExcluindo(false);
    }
  }

  function podeGerenciar(foto: FotoTreino) {
    return usuario?.perfil === "ADMIN" || usuario?.id === foto.publicadaPorId;
  }

  return (
    <div className="foto-treino-bloco">
      <ErrorMessage message={erro} />

      {!carregando && fotos.length > 0 && (
        <div className="foto-treino-lista">
          {fotos.map((foto) => (
            <div key={foto.id} className="foto-treino-item">
              <img src={resolverUrlUpload(foto.url)} alt={foto.legenda} className="foto-treino-imagem" />
              <p className="foto-treino-legenda">{foto.legenda}</p>
              <div className="foto-treino-tags">
                <Badge variant={foto.visivelNaLanding ? "success" : "neutral"}>
                  {foto.visivelNaLanding ? "Visível na landing" : "Só no Portal da Família"}
                </Badge>
              </div>

              {podeGerenciar(foto) && (
                <div className="foto-treino-acoes">
                  <Button type="button" size="sm" variant="secondary" onClick={() => alternarVisibilidade(foto)}>
                    {foto.visivelNaLanding ? "Tornar privada" : "Tornar pública"}
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => setFotoParaExcluir(foto)}>
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="foto-treino-upload">
        <label className="foto-treino-upload-label">
          <span>Adicionar fotos</span>
          <input type="file" accept="image/*" multiple onChange={handleSelecionarArquivos} disabled={enviandoArquivos} />
        </label>

        {enviandoArquivos && <p className="foto-treino-enviando">Enviando fotos...</p>}

        {arquivosSelecionados.length > 0 && (
          <>
            <div className="foto-treino-pendentes">
              {arquivosSelecionados.map((arquivo, indice) => (
                <div key={`${arquivo.name}-${indice}`} className="foto-treino-pendente-item">
                  <span>{arquivo.name}</span>
                  <button type="button" onClick={() => removerPendente(indice)} aria-label="Remover foto">
                    ×
                  </button>
                </div>
              ))}
            </div>

            <Input label="Legenda" value={legenda} onChange={(e) => setLegenda(e.target.value)} />

            <Checkbox
              label="Publicar também na galeria pública do site (landing page)"
              checked={visivelNaLanding}
              onChange={(e) => setVisivelNaLanding(e.target.checked)}
            />

            <Button type="button" disabled={publicando} onClick={publicarFotos}>
              {publicando ? "Publicando..." : "Publicar foto"}
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={fotoParaExcluir !== null}
        title="Excluir foto"
        message="Excluir esta foto do treino? Ela deixa de aparecer na galeria pública e no Portal da Família."
        confirmLabel="Excluir"
        loading={excluindo}
        onConfirm={excluirFoto}
        onCancel={() => setFotoParaExcluir(null)}
      />
    </div>
  );
}
