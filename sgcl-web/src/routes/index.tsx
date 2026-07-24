import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Login } from "../pages/Login";
import { Loading } from "../components/ui/Loading";
import { PrivateRoute } from "./PrivateRoute";

const Dashboard = lazy(() => import("../pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Alunos = lazy(() => import("../modules/alunos/pages/Listar").then((m) => ({ default: m.Alunos })));
const AlunoDetalhes = lazy(() => import("../modules/alunos/pages/Detalhes").then((m) => ({ default: m.AlunoDetalhes })));

const CadastroAluno = lazy(() => import("../modules/alunos/pages/Cadastro").then((m) => ({ default: m.CadastroAluno })));
const EditarAluno = lazy(() => import("../modules/alunos/pages/Editar").then((m) => ({ default: m.EditarAluno })));

const Aulas = lazy(() => import("../modules/aulas/pages/Listar").then((m) => ({ default: m.Aulas })));
const ChamadaAula = lazy(() => import("../modules/aulas/pages/Chamada").then((m) => ({ default: m.ChamadaAula })));
const ProntuarioAluno = lazy(() => import("../modules/alunos/pages/Prontuario").then((m) => ({ default: m.ProntuarioAluno })));

const ListarMensalidades = lazy(() => import("../modules/mensalidades/pages/Listar").then((m) => ({ default: m.ListarMensalidades })));
const DetalheMensalidade = lazy(() => import("../modules/mensalidades/pages/Detalhes").then((m) => ({ default: m.DetalheMensalidade })));
const NovaMensalidade = lazy(() => import("../modules/mensalidades/pages/Detalhes/novo").then((m) => ({ default: m.NovaMensalidade })));
const Usuarios = lazy(() => import("../modules/usuarios/pages/Listar").then((m) => ({ default: m.Usuarios })));
const ListarGraduacoes = lazy(() => import("../modules/graduacoes/pages/Listar").then((m) => ({ default: m.ListarGraduacoes })));
const ProximasGraduacoes = lazy(() => import("../modules/graduacoes/pages/Proximas").then((m) => ({ default: m.ProximasGraduacoes })));
const Relatorios = lazy(() => import("../modules/relatorios/pages/Listar").then((m) => ({ default: m.Relatorios })));
const Competicoes = lazy(() => import("../modules/competicoes/pages/Listar").then((m) => ({ default: m.Competicoes })));
const Financeiro = lazy(() => import("../modules/financeiro/pages/Listar").then((m) => ({ default: m.Financeiro })));
const DetalheCompeticao = lazy(() => import("../modules/competicoes/pages/Detalhes").then((m) => ({ default: m.DetalheCompeticao })));
const Curriculos = lazy(() => import("../modules/curriculos/pages/Listar").then((m) => ({ default: m.Curriculos })));

const Turmas = lazy(() => import("../modules/turmas/pages/Listar").then((m) => ({ default: m.Turmas })));
const DetalheTurma = lazy(() => import("../modules/turmas/pages/Detalhes").then((m) => ({ default: m.DetalheTurma })));

const Planos = lazy(() => import("../modules/planos/pages/Listar").then((m) => ({ default: m.Planos })));
const Mensagens = lazy(() => import("../modules/mensagens/pages/Listar").then((m) => ({ default: m.Mensagens })));

export function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/alunos"
          element={
            <PrivateRoute>
              <Alunos />
            </PrivateRoute>
          }
        />

        <Route
          path="/alunos/:id"
          element={
            <PrivateRoute>
              <AlunoDetalhes />
            </PrivateRoute>
          }
        />

        <Route
          path="/alunos/:id/prontuario"
          element={
            <PrivateRoute>
              <ProntuarioAluno />
            </PrivateRoute>
          }
        />

        <Route
          path="/alunos/cadastro"
          element={
            <PrivateRoute>
              <CadastroAluno />
            </PrivateRoute>
          }
        />

        <Route
          path="/alunos/:id/editar"
          element={
            <PrivateRoute>
              <EditarAluno />
            </PrivateRoute>
          }
        />

        <Route
          path="/aulas"
          element={
            <PrivateRoute>
              <Aulas />
            </PrivateRoute>
          }
        />

        <Route
          path="/aulas/:id/chamada"
          element={
            <PrivateRoute>
              <ChamadaAula />
            </PrivateRoute>
          }
        />

        <Route
          path="/mensalidades"
          element={
            <PrivateRoute>
              <ListarMensalidades />
            </PrivateRoute>
          }
        />

        <Route
          path="/mensalidades/novo"
          element={
            <PrivateRoute>
              <NovaMensalidade />
            </PrivateRoute>
          }
        />

        <Route
          path="/mensalidades/:id"
          element={
            <PrivateRoute>
              <DetalheMensalidade />
            </PrivateRoute>
          }
        />

        <Route
          path="/graduacoes"
          element={
            <PrivateRoute>
              <ListarGraduacoes />
            </PrivateRoute>
          }
        />

        <Route
          path="/graduacoes/proximas"
          element={
            <PrivateRoute>
              <ProximasGraduacoes />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <Usuarios />
            </PrivateRoute>
          }
        />

        <Route
          path="/competicoes"
          element={
            <PrivateRoute>
              <Competicoes />
            </PrivateRoute>
          }
        />

        <Route
          path="/competicoes/:id"
          element={
            <PrivateRoute>
              <DetalheCompeticao />
            </PrivateRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <Relatorios />
            </PrivateRoute>
          }
        />

        <Route
          path="/financeiro"
          element={
            <PrivateRoute>
              <Financeiro />
            </PrivateRoute>
          }
        />

        <Route
          path="/planejamento"
          element={
            <PrivateRoute>
              <Curriculos />
            </PrivateRoute>
          }
        />

        <Route
          path="/turmas"
          element={
            <PrivateRoute>
              <Turmas />
            </PrivateRoute>
          }
        />

        <Route
          path="/turmas/:id"
          element={
            <PrivateRoute>
              <DetalheTurma />
            </PrivateRoute>
          }
        />

        <Route
          path="/planos"
          element={
            <PrivateRoute>
              <Planos />
            </PrivateRoute>
          }
        />

        <Route
          path="/aulas/programacao"
          element={<Navigate to="/aulas" replace />}
        />

        <Route
          path="/mensagens"
          element={
            <PrivateRoute>
              <Mensagens />
            </PrivateRoute>
          }
        />

      </Routes>
    </Suspense>
  );
}
