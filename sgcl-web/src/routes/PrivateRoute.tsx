import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({
  children,
}: PrivateRouteProps) {

  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}