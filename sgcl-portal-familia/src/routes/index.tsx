import { Routes, Route } from "react-router-dom";

import { Login } from "../modules/portal/pages/Login";
import { Portal } from "../modules/portal/pages/Portal";
import { PrivateRoute } from "./PrivateRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

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
