import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { SiteFooter } from "./components/ui/SiteFooter";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <SiteFooter />
    </BrowserRouter>
  );
}

export default App;
