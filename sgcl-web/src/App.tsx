import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useAuth } from "./contexts/useAuth";

function App() {
  const { unidadeVisualizada } = useAuth();

  return (
    <BrowserRouter>
      {/* Remonta as rotas quando um usuário multiunidade troca sua unidade
          ativa, fazendo cada página recarregar no novo escopo. */}
      <AppRoutes key={unidadeVisualizada?.id ?? "todas"} />
    </BrowserRouter>
  );
}

export default App;
