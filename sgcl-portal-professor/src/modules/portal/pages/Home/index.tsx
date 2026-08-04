import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../../contexts/useAuth";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Button } from "../../../../components/ui/Button";
import { PortalProfessorService } from "../../services/PortalProfessorService";
import { getApiErrorMessage } from "../../../../utils/getApiErrorMessage";
import type { AulasHojeResponse, AulaHojeItem } from "../../types";

import "./styles.css";

// Telas nativas dentro do próprio Portal — consomem o backend direto (mesmo
// token já autenticado aqui), sem abrir outro app nem pedir login de novo.
const ATALHOS = [
  { titulo: "Planejamento", descricao: "Currículo (leitura)", to: "/planejamento" },
  { titulo: "Prontuários", descricao: "Ficha dos alunos", to: "/prontuarios" },
  { titulo: "Graduações", descricao: "Solicitar/consultar", to: "/graduacoes" },
  { titulo: "Minhas turmas", descricao: "Grade completa", to: "/turmas" },
];

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeiras = [partes[0], partes[partes.length - 1]].filter(Boolean);
  return primeiras.map((parte) => parte[0]?.toUpperCase() ?? "").join("");
}

function formatarTempo(minutos: number) {
  if (minutos <= 0) return "agora";
  if (minutos < 60) return `em ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `em ${horas}h` : `em ${horas}h${resto}min`;
}

function ItemHoje({ item, onClique }: { item: AulaHojeItem; onClique: (item: AulaHojeItem) => void }) {
  const rotuloStatus =
    item.status === "CONCLUIDA" ? "Concluída" : item.status === "EM_ANDAMENTO" ? "Em andamento" : "Depois";
  const clicavel = item.status !== "CONCLUIDA";

  return (
    <button
      type="button"
      className="home-item-hoje"
      onClick={() => clicavel && onClique(item)}
      disabled={!clicavel}
    >
      <span className="home-item-hoje-horario">{item.horarioInicio}</span>
      <span className="home-item-hoje-texto">
        <strong>{item.turmaNome}</strong>
        <span>{item.totalAlunos} alunos</span>
      </span>
      <span className={`home-item-hoje-chip home-item-hoje-chip-${item.status.toLowerCase()}`}>{rotuloStatus}</span>
    </button>
  );
}

export function Home() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [dados, setDados] = useState<AulasHojeResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");
      const resultado = await PortalProfessorService.hoje();
      setDados(resultado);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível carregar as aulas de hoje."));
    } finally {
      setCarregando(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleIniciarAula(item: AulaHojeItem) {
    if (item.aulaId) {
      navigate(`/aula/${item.aulaId}`);
      return;
    }

    try {
      setIniciando(true);
      setErro("");
      const aula = await PortalProfessorService.iniciarAulaProgramada(item.aulaProgramadaId);
      navigate(`/aula/${aula.id}`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível iniciar a aula."));
    } finally {
      setIniciando(false);
    }
  }

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-topo">
          <div>
            <p className="home-eyebrow">Portal do Professor</p>
            <h1>{usuario?.apelido || usuario?.nome}</h1>
          </div>
          <button type="button" className="home-avatar" onClick={handleLogout} aria-label="Sair">
            {iniciais(usuario?.nome ?? "")}
          </button>
        </div>
        <p className="home-data">{hoje}</p>
      </header>

      <main className="home-conteudo">
        {carregando && <Loading message="Carregando suas aulas..." />}

        {!carregando && erro && <ErrorMessage message={erro} onRetry={carregar} />}

        {!carregando && !erro && dados && (
          <>
            {dados.proximaAula ? (
              <div className="home-card-proxima">
                <span className="home-card-proxima-marcador">
                  <span className="home-card-proxima-bolinha" aria-hidden="true" />
                  {dados.proximaAula.status === "EM_ANDAMENTO"
                    ? "AULA EM ANDAMENTO"
                    : `PRÓXIMA AULA · ${formatarTempo(dados.proximaAula.minutosParaComeco)}`}
                </span>

                <h2>{dados.proximaAula.turmaNome}</h2>
                <p className="home-card-proxima-info">
                  {dados.proximaAula.horarioInicio}–{dados.proximaAula.horarioFim} · {dados.proximaAula.totalAlunos} alunos
                </p>

                {dados.proximaAula.plano && (
                  <p className="home-card-proxima-plano">
                    {dados.proximaAula.plano.moduloNome} · {dados.proximaAula.plano.totalTecnicas} técnicas planejadas
                  </p>
                )}

                <Button
                  className="home-card-proxima-botao"
                  disabled={iniciando}
                  onClick={() => handleIniciarAula(dados.proximaAula!)}
                >
                  {iniciando ? "Abrindo..." : dados.proximaAula.status === "EM_ANDAMENTO" ? "Continuar aula" : "Iniciar aula"}
                </Button>
              </div>
            ) : (
              <div className="home-card-proxima home-card-proxima-vazia">
                <span className="home-card-proxima-marcador home-card-proxima-marcador-neutro">SEM AULAS HOJE</span>
                {dados.proximaSemana ? (
                  <>
                    <h2>{dados.proximaSemana.turmaNome}</h2>
                    <p className="home-card-proxima-info">
                      Próxima aula: {new Date(dados.proximaSemana.data).toLocaleDateString("pt-BR")} às{" "}
                      {dados.proximaSemana.horarioInicio}
                    </p>
                  </>
                ) : (
                  <p className="home-card-proxima-info">Nenhuma aula programada nos próximos dias.</p>
                )}
              </div>
            )}

            {dados.outrasHoje.length > 0 && (
              <section className="home-secao">
                <h3>Também hoje</h3>
                <div className="home-lista-hoje">
                  {dados.outrasHoje.map((item) => (
                    <ItemHoje key={item.aulaProgramadaId} item={item} onClique={handleIniciarAula} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <section className="home-secao">
          <h3>Preparação e análise</h3>
          <p className="home-secao-subtitulo">Para usar fora do horário de aula</p>

          <div className="home-grid-atalhos">
            {ATALHOS.map((atalho) => (
              <Link key={atalho.titulo} className="home-atalho" to={atalho.to}>
                <strong>{atalho.titulo}</strong>
                <span>{atalho.descricao}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
