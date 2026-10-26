import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { iniciarMonitoramento } from "./shared/observabilidade/monitoramento";
import { AuthProvider } from "./contexts/AuthContext";

import "./styles/global.css";

iniciarMonitoramento();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
