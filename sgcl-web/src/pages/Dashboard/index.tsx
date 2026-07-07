import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../components/layout/Layout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";

import { DashboardService, type DashboardResumo } from "./DashboardService";
import { GraduacaoService } from "../../modules/graduacoes/services/GraduacaoService";
import type { AlunoElegivel } from "../../modules/graduacoes/types";
import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";

import "./styles.css";

export function Dashboard() {
  const navigate = useNavigate();

  const [dados, setDados] = useState<DashboardResumo | null>(null);
  const [proximasGraduacoes, setProximasGraduacoes] = useState<AlunoElegivel[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setErro("");
        const [resumo, elegiveis] = await Promise.all([
          DashboardService.resumo(),
          GraduacaoService.listarProximas(),
        ]);

        setDados(resumo);
        setProximasGraduacoes(elegiveis);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar dashboard."));
      }
    }

    carregar();
  }, []);

  if (erro) {
    return (
      <Layout>
        <ErrorMessage message={erro} />
      </Layout>
    );
  }

  if (!dados) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Dashboard" subtitle="Resumo geral da academia." />

      {dados.mensalidadesVencidas > 0 && (
        <div className="dashboard-alerta">
          <span>
            ⚠️ {dados.mensalidadesVencidas} mensalidade(s) vencida(s) precisam de atenção.
          </span>

          <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
            Ver mensalidades
          </Button>
        </div>
      )}

      <section className="dashboard-secao">
        <h2>Alunos e Atividades</h2>

        <div className="dashboard-grid">
          <Card titulo="Alunos Ativos" valor={dados.alunosAtivos} />
          <Card titulo="Responsáveis" valor={dados.responsaveis} />
          <Card titulo="Presenças Hoje" valor={dados.presencasHoje} />
          <Card titulo="Graduações" valor={dados.graduacoes} />
          <Card titulo="Competições" valor={dados.competicoes} />
        </div>
      </section>

      <section className="dashboard-secao">
        <h2>Financeiro</h2>

        <div className="dashboard-grid">
          <Card titulo="Total Recebido" valor={`R$ ${dados.totalRecebido.toFixed(2)}`} />
          <Card titulo="Total Pendente" valor={`R$ ${dados.totalPendente.toFixed(2)}`} />
          <Card titulo="Mensalidades Pendentes" valor={dados.mensalidadesPendentes} />
          <Card titulo="Mensalidades Vencidas" valor={dados.mensalidadesVencidas} />
        </div>
      </section>

      <section className="dashboard-secao">
        <h2>Próximas Graduações</h2>

        {proximasGraduacoes.length === 0 ? (
          <p className="dashboard-vazio">Nenhum aluno elegível no momento.</p>
        ) : (
          <div className="dashboard-lista">
            {proximasGraduacoes.slice(0, 5).map((aluno) => (
              <div key={aluno.id} className="dashboard-lista-item">
                <span>{aluno.nome}</span>
                <span>{aluno.faixa}</span>
                <span>{aluno.presencas} aulas</span>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="secondary" onClick={() => navigate("/graduacoes/proximas")}>
          Ver todos
        </Button>
      </section>
    </Layout>
  );
}