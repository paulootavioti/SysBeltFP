import { Routes, Route } from "react-router-dom";

import { Login } from "../modules/portal/pages/Login";
import { RecuperarSenha } from "../modules/portal/pages/RecuperarSenha";
import { Portal } from "../modules/portal/pages/Portal";
import { PrivateRoute } from "./PrivateRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/redefinir-senha" element={<RecuperarSenha />} />

      <Route
        path="/portal"
        element={
          <PrivateRoute>
            <Portal />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
