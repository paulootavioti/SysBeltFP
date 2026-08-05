import { BrowserRouter, useLocation } from "react-router-dom";
import { AppRoutes } from "./routes";
import { SiteFooter } from "./components/ui/SiteFooter";

// O Modo Aula (/aula/:id) é um fluxo imersivo pensado pro tatame — sem menu,
// sem distração, só as 4 etapas. O rodapé aparece em todas as outras telas,
// inclusive no resumo (/aula/:id/resumo), que já é a saída desse fluxo.
function RodapeForaDoModoAula() {
  const { pathname } = useLocation();

  if (/^\/aula\/[^/]+\/?$/.test(pathname)) {
    return null;
  }

  return <SiteFooter />;
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <RodapeForaDoModoAula />
    </BrowserRouter>
  );
}

export default App;
