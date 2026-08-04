import { Routes, Route } from "react-router-dom";

import { Login } from "../modules/portal/pages/Login";
import { Home } from "../modules/portal/pages/Home";
import { Aula } from "../modules/portal/pages/Aula";
import { Resumo } from "../modules/portal/pages/Resumo";
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
    </Routes>
  );
}
