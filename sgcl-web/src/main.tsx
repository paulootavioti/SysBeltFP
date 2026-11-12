import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { iniciarMonitoramento } from "./shared/observabilidade/monitoramento";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/toast/ToastProvider";

import "./styles/global.css";

iniciarMonitoramento();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);