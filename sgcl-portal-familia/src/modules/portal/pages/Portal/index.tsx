import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuCalendarCheck,
  LuWallet,
  LuMessageCircle,
  LuEllipsis,
} from "react-icons/lu";

import { useAuth } from "../../../../contexts/useAuth";
import { useContadorMensagens } from "../../../../hooks/useContadorMensagens";
import { Button } from "../../../../components/ui/Button";
import { Tabs } from "../../../../components/ui/Tabs";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Badge } from "../../../../components/ui/Badge";

import { ResumoTab } from "../../components/ResumoTab";
import { FrequenciaTab } from "../../components/FrequenciaTab";
import { MensalidadesTab } from "../../components/MensalidadesTab";
import { MensagensTab } from "../../components/MensagensTab";
import { MaisTab } from "../../components/MaisTab";

import "./styles.css";

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// label das abas: ícone em cima + texto embaixo, pra virar barra de
// navegação inferior no mobile (ver Tabs/styles.css) — no desktop a
// mesma marcação só fica lado a lado no topo, sem precisar de outra versão.
function tabLabel(Icon: typeof LuLayoutDashboard, texto: string, badge?: number) {
  return (
    <span className="portal-tab-label">
      <Icon aria-hidden />
      <span>{texto}</span>
      {!!badge && <Badge variant="info">{badge}</Badge>}
    </span>
  );
}

export function Portal() {
  const navigate = useNavigate();
  const { usuario, alunos, alunoSelecionadoId, selecionarAluno, logout } = useAuth();
  const naoLidasPorAluno = useContadorMensagens();
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const [abrirPrivacidadeEm, setAbrirPrivacidadeEm] = useState(0);
  const [eventoInstalacao, setEventoInstalacao] = useState<EventoInstalacao | null>(null);

  useEffect(() => {
    const receber = (evento: Event) => {
      evento.preventDefault();
      setEventoInstalacao(evento as EventoInstalacao);
    };
    window.addEventListener("beforeinstallprompt", receber);
    return () => window.removeEventListener("beforeinstallprompt", receber);
  }, []);

  async function instalarAplicativo() {
    if (!eventoInstalacao) return;
    await eventoInstalacao.prompt();
    if ((await eventoInstalacao.userChoice).outcome === "accepted") setEventoInstalacao(null);
  }

  function abrirPrivacidade() {
    setAbrirPrivacidadeEm((valor) => valor + 1);
    setAbaAtiva("mais");
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div>
          <h1>Portal da Família</h1>
          <p>Olá, {usuario?.nome}</p>
        </div>

        <Button type="button" variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </header>

      {eventoInstalacao && (
        <button type="button" className="portal-instalar" onClick={instalarAplicativo}>
          Instalar Portal da Família
        </button>
      )}

      {alunos.length > 1 && (
        <>
          {/* mais de 2 filhos: em telas estreitas isso vira um dropdown
              (classe portal-select-aluno) pra não quebrar linha feio no
              header — os chips continuam só pra tablet/desktop. Com só 2,
              os chips cabem numa linha em qualquer largura. */}
          {alunos.length > 2 && (
            <select
              className="portal-select-aluno"
              value={alunoSelecionadoId ?? ""}
              onChange={(e) => selecionarAluno(Number(e.target.value))}
              aria-label="Selecionar filho"
            >
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.apelido || aluno.nome}
                  {naoLidasPorAluno[aluno.id] ? ` (${naoLidasPorAluno[aluno.id]} nova)` : ""}
                </option>
              ))}
            </select>
          )}

          <div className={`portal-chips${alunos.length > 2 ? " portal-chips-tablet-acima" : ""}`}>
            {alunos.map((aluno) => (
              <button
                key={aluno.id}
                type="button"
                className={`portal-chip${aluno.id === alunoSelecionadoId ? " portal-chip-ativo" : ""}`}
                onClick={() => selecionarAluno(aluno.id)}
              >
                <span className="portal-chip-iniciais">{aluno.iniciais}</span>
                {aluno.apelido || aluno.nome}
                {!!naoLidasPorAluno[aluno.id] && (
                  <span className="portal-chip-badge">{naoLidasPorAluno[aluno.id]}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {!alunoSelecionadoId ? (
        <EmptyState title="Nenhum aluno vinculado" description="Fale com a academia para vincular um aluno à sua conta." />
      ) : (
        <Tabs
          key={alunoSelecionadoId}
          value={abaAtiva}
          onChange={setAbaAtiva}
          tabs={[
            { value: "resumo", label: tabLabel(LuLayoutDashboard, "Início"), content: <ResumoTab alunoId={alunoSelecionadoId} onOpenPrivacy={abrirPrivacidade} /> },
            {
              value: "frequencia",
              label: tabLabel(LuCalendarCheck, "Evolução"),
              content: <FrequenciaTab alunoId={alunoSelecionadoId} />,
            },
            {
              value: "mensalidades",
              label: tabLabel(LuWallet, "Pagar"),
              content: <MensalidadesTab alunoId={alunoSelecionadoId} />,
            },
            {
              value: "mensagens",
              label: tabLabel(LuMessageCircle, "Falar", naoLidasPorAluno[alunoSelecionadoId]),
              content: <MensagensTab alunoId={alunoSelecionadoId} />,
            },
            { value: "mais", label: tabLabel(LuEllipsis, "Mais"), content: <MaisTab alunoId={alunoSelecionadoId} abrirPrivacidadeEm={abrirPrivacidadeEm} /> },
          ]}
        />
      )}
    </div>
  );
}
