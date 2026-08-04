import { useState } from "react";
import { LuCompass, LuMessageCircleQuestion } from "react-icons/lu";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { ARTIGOS_AJUDA, CATEGORIAS_AJUDA } from "../../data/artigos";
import { ArtigoCard } from "../../components/ArtigoCard";
import { TourGuiadoModal } from "../../components/TourGuiadoModal";
import { FalarComSuporteModal } from "../../components/FalarComSuporteModal";
import { useFeedbackArtigos } from "../../hooks/useFeedbackArtigos";

import "./styles.css";

// vira o id da seção da categoria, usado tanto pelos chips (mobile) quanto
// pela coluna lateral (desktop) pra rolar até o trecho certo.
function idDaCategoria(categoria: string) {
  return `ajuda-categoria-${categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}`;
}

function irParaCategoria(categoria: string) {
  document.getElementById(idDaCategoria(categoria))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CentralDeAjuda() {
  const [busca, setBusca] = useState("");
  const [artigosAbertos, setArtigosAbertos] = useState<Record<string, boolean>>({});
  const [tourAberto, setTourAberto] = useState(false);
  const [suporteAberto, setSuporteAberto] = useState(false);

  const { feedbacks, registrarFeedback } = useFeedbackArtigos();

  const termo = busca.trim().toLowerCase();
  const artigosFiltrados = termo
    ? ARTIGOS_AJUDA.filter(
        (artigo) =>
          artigo.titulo.toLowerCase().includes(termo) || artigo.resumo.toLowerCase().includes(termo)
      )
    : ARTIGOS_AJUDA;

  function alternarArtigo(id: string) {
    setArtigosAbertos((atual) => ({ ...atual, [id]: !(atual[id] ?? false) }));
  }

  return (
    <Layout>
      <div className="ajuda-central-container">
        <PageHeader
          title="Central de Ajuda"
          subtitle="Artigos por categoria, tour guiado e canal direto com o suporte."
        />

        <div className="ajuda-barra-ferramentas">
          <Input
            placeholder="Buscar por título ou resumo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <Button type="button" variant="secondary" onClick={() => setTourAberto(true)}>
            <LuCompass size={16} /> Iniciar tour guiado
          </Button>
        </div>

        <div className="ajuda-layout">
        <nav className="ajuda-categorias-nav" aria-label="Categorias">
          {CATEGORIAS_AJUDA.map((categoria) => (
            <button
              key={categoria}
              type="button"
              className="ajuda-categoria-chip"
              onClick={() => irParaCategoria(categoria)}
            >
              {categoria}
            </button>
          ))}
        </nav>

        <div className="ajuda-conteudo">
          {artigosFiltrados.length === 0 ? (
            <EmptyState
              title="Nenhum artigo encontrado"
              description="Ajuste os termos da busca ou fale com o suporte abaixo."
            />
          ) : (
            CATEGORIAS_AJUDA.map((categoria) => {
              const artigosDaCategoria = artigosFiltrados.filter((artigo) => artigo.categoria === categoria);
              if (artigosDaCategoria.length === 0) return null;

              return (
                <section key={categoria} id={idDaCategoria(categoria)} className="ajuda-categoria">
                  <h2>{categoria}</h2>

                  <div className="ajuda-categoria-lista">
                    {artigosDaCategoria.map((artigo) => (
                      <ArtigoCard
                        key={artigo.id}
                        artigo={artigo}
                        expandido={artigosAbertos[artigo.id] ?? false}
                        onToggle={() => alternarArtigo(artigo.id)}
                        feedback={feedbacks[artigo.id]}
                        onFeedback={(feedback) => registrarFeedback(artigo.id, feedback)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>

        <section className="ajuda-suporte">
          <LuMessageCircleQuestion size={28} />
          <div>
            <h2>Não encontrou o que precisava?</h2>
            <p>Fale diretamente com a nossa equipe de suporte.</p>
          </div>
          <Button type="button" onClick={() => setSuporteAberto(true)}>
            Falar com o suporte
          </Button>
        </section>
      </div>

      <TourGuiadoModal open={tourAberto} onClose={() => setTourAberto(false)} />
      <FalarComSuporteModal open={suporteAberto} onClose={() => setSuporteAberto(false)} />
    </Layout>
  );
}
