import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { perfilTemAcesso, ROTA_PADRAO_POR_PERFIL, type Perfil } from "../shared/constants/acessoPorPerfil";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({
  children,
}: PrivateRouteProps) {

  const { token, usuario } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!perfilTemAcesso(usuario?.perfil, location.pathname)) {
    const destino = ROTA_PADRAO_POR_PERFIL[usuario?.perfil as Perfil] ?? "/alunos";
    return <Navigate to={destino} replace />;
  }

  return <>{children}</>;
}
