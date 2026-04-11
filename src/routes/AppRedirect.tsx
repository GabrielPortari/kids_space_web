import { Navigate } from "react-router-dom";
import { authRolePaths, useAuth } from "../auth/AuthContext";

export function AppRedirect() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={authRolePaths[session.role]} replace />;
}
