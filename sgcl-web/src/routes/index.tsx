import { Routes, Route } from "react-router-dom";

import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Alunos } from "../modules/alunos/pages/Listar";
import { AlunoDetalhes } from "../modules/alunos/pages/Detalhes";

import { CadastroAluno } from "../modules/alunos/pages/Cadastro";
import { EditarAluno } from "../modules/alunos/pages/Editar";

import { Aulas } from "../modules/aulas/pages/Listar";
import { ChamadaAula } from "../modules/aulas/pages/Chamada";
import { ProntuarioAluno } from "../modules/alunos/pages/Prontuario";

import { ListarMensalidades } from "../modules/mensalidades/pages/Listar";
import { DetalheMensalidade } from "../modules/mensalidades/pages/Detalhes";
import { NovaMensalidade } from "../modules/mensalidades/pages/Detalhes/novo";

import { ListarGraduacoes } from "../modules/graduacoes/pages/Listar";
import { ProximasGraduacoes } from "../modules/graduacoes/pages/Proximas";

import { PrivateRoute } from "./PrivateRoute";

export function AppRoutes() {
  return (
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
        element={<ProntuarioAluno />}
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

      <Route path="/aulas" element={<Aulas />} />
      <Route path="/aulas/:id/chamada" element={<ChamadaAula />} />

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
    </Routes>
  );
}
