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
const Arenas = lazy(() => import("../modules/arenas/pages/Listar").then((m) => ({ default: m.Arenas })));
const Modalidades = lazy(() => import("../modules/modalidades/pages/Listar").then((m) => ({ default: m.Modalidades })));
const Unidades = lazy(() => import("../modules/unidades/pages/Listar").then((m) => ({ default: m.Unidades })));
const Mensagens = lazy(() => import("../modules/mensagens/pages/Listar").then((m) => ({ default: m.Mensagens })));
const MensagensFamiliaListar = lazy(() =>
  import("../modules/mensagensFamilia/pages/Listar").then((m) => ({ default: m.MensagensFamiliaListar }))
);

const Metas = lazy(() => import("../modules/metas/pages/Listar").then((m) => ({ default: m.Metas })));

const FormasPagamento = lazy(() => import("../modules/formasPagamento/pages/Listar").then((m) => ({ default: m.FormasPagamento })));
const Assinaturas = lazy(() => import("../modules/assinaturas/pages/Listar").then((m) => ({ default: m.Assinaturas })));
const ModelosContrato = lazy(() => import("../modules/modelosContrato/pages/Listar").then((m) => ({ default: m.ModelosContrato })));
const Contratos = lazy(() => import("../modules/contratos/pages/Listar").then((m) => ({ default: m.Contratos })));
const Loja = lazy(() => import("../modules/loja/pages/Listar").then((m) => ({ default: m.Loja })));
const Pedidos = lazy(() => import("../modules/loja/pages/Pedidos").then((m) => ({ default: m.Pedidos })));
const Leads = lazy(() => import("../modules/leads/pages/Listar").then((m) => ({ default: m.Leads })));
const DetalheContrato = lazy(() => import("../modules/contratos/pages/Detalhes").then((m) => ({ default: m.DetalheContrato })));

const CentralDeAjuda = lazy(() => import("../modules/ajuda/pages/Central").then((m) => ({ default: m.CentralDeAjuda })));

const AreaDoProfessor = lazy(() =>
  import("../modules/professor/pages/AreaDoProfessor").then((m) => ({ default: m.AreaDoProfessor }))
);

const Eventos = lazy(() => import("../modules/eventos/pages/Listar").then((m) => ({ default: m.Eventos })));
const NovoEvento = lazy(() => import("../modules/eventos/pages/Novo").then((m) => ({ default: m.NovoEvento })));
const DetalheEvento = lazy(() => import("../modules/eventos/pages/Detalhes").then((m) => ({ default: m.DetalheEvento })));
const EditarEvento = lazy(() => import("../modules/eventos/pages/Editar").then((m) => ({ default: m.EditarEvento })));

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
          path="/unidades"
          element={
            <PrivateRoute>
              <Unidades />
            </PrivateRoute>
          }
        />

        <Route
          path="/arenas"
          element={
            <PrivateRoute>
              <Arenas />
            </PrivateRoute>
          }
        />

        <Route
          path="/modalidades"
          element={
            <PrivateRoute>
              <Modalidades />
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

        <Route
          path="/mensagens-familia"
          element={
            <PrivateRoute>
              <MensagensFamiliaListar />
            </PrivateRoute>
          }
        />

        <Route
          path="/metas"
          element={
            <PrivateRoute>
              <Metas />
            </PrivateRoute>
          }
        />

        <Route
          path="/eventos"
          element={
            <PrivateRoute>
              <Eventos />
            </PrivateRoute>
          }
        />

        <Route
          path="/eventos/novo"
          element={
            <PrivateRoute>
              <NovoEvento />
            </PrivateRoute>
          }
        />

        <Route
          path="/eventos/:id"
          element={
            <PrivateRoute>
              <DetalheEvento />
            </PrivateRoute>
          }
        />

        <Route
          path="/eventos/:id/editar"
          element={
            <PrivateRoute>
              <EditarEvento />
            </PrivateRoute>
          }
        />

        <Route
          path="/financeiro/formas-pagamento"
          element={
            <PrivateRoute>
              <FormasPagamento />
            </PrivateRoute>
          }
        />

        <Route
          path="/loja"
          element={
            <PrivateRoute>
              <Loja />
            </PrivateRoute>
          }
        />

        <Route
          path="/loja/pedidos"
          element={
            <PrivateRoute>
              <Pedidos />
            </PrivateRoute>
          }
        />

        <Route
          path="/leads"
          element={
            <PrivateRoute>
              <Leads />
            </PrivateRoute>
          }
        />

        <Route
          path="/assinaturas"
          element={
            <PrivateRoute>
              <Assinaturas />
            </PrivateRoute>
          }
        />

        <Route
          path="/modelos-contrato"
          element={
            <PrivateRoute>
              <ModelosContrato />
            </PrivateRoute>
          }
        />

        <Route
          path="/contratos"
          element={
            <PrivateRoute>
              <Contratos />
            </PrivateRoute>
          }
        />

        <Route
          path="/contratos/:id"
          element={
            <PrivateRoute>
              <DetalheContrato />
            </PrivateRoute>
          }
        />

        <Route
          path="/ajuda"
          element={
            <PrivateRoute>
              <CentralDeAjuda />
            </PrivateRoute>
          }
        />

        <Route
          path="/professor"
          element={
            <PrivateRoute>
              <AreaDoProfessor />
            </PrivateRoute>
          }
        />

      </Routes>
    </Suspense>
  );
}
