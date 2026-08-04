import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../contexts/useAuth";

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
