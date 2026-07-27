import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useAuth } from "./contexts/useAuth";

function App() {
  const { unidadeVisualizada } = useAuth();

  return (
    <BrowserRouter>
      {/* remonta toda a árvore de rotas ao trocar a unidade visualizada
          (SUPERADMIN), pra cada página recarregar os dados sob o novo
          filtro sem precisar tratar isso individualmente. */}
      <AppRoutes key={unidadeVisualizada?.id ?? "todas"} />
    </BrowserRouter>
  );
}

export default App;
