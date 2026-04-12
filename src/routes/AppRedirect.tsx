import { Navigate } from "react-router-dom";
import { authRolePaths } from "../auth/authRoles";
import { useAuth } from "../auth/useAuth";

export function AppRedirect() {
  const { session, status } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={authRolePaths[session.role]} replace />;
}
