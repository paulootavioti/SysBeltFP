import { Routes, Route } from "react-router-dom";

import { Login } from "../modules/portal/pages/Login";
import { Home } from "../modules/portal/pages/Home";
import { Aula } from "../modules/portal/pages/Aula";
import { Resumo } from "../modules/portal/pages/Resumo";
import { Turmas } from "../modules/portal/pages/Turmas";
import { Planejamento } from "../modules/portal/pages/Planejamento";
import { Prontuarios } from "../modules/portal/pages/Prontuarios";
import { ProntuarioDetalhe } from "../modules/portal/pages/Prontuarios/Detalhe";
import { Graduacoes } from "../modules/portal/pages/Graduacoes";
import { PrivateRoute } from "./PrivateRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      <Route
        path="/aula/:id"
        element={
          <PrivateRoute>
            <Aula />
          </PrivateRoute>
        }
      />

      <Route
        path="/aula/:id/resumo"
        element={
          <PrivateRoute>
            <Resumo />
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
        path="/planejamento"
        element={
          <PrivateRoute>
            <Planejamento />
          </PrivateRoute>
        }
      />

      <Route
        path="/prontuarios"
        element={
          <PrivateRoute>
            <Prontuarios />
          </PrivateRoute>
        }
      />

      <Route
        path="/prontuarios/:alunoId"
        element={
          <PrivateRoute>
            <ProntuarioDetalhe />
          </PrivateRoute>
        }
      />

      <Route
        path="/graduacoes"
        element={
          <PrivateRoute>
            <Graduacoes />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
