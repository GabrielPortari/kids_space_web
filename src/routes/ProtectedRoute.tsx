import { Navigate, Outlet } from "react-router-dom";
import { authRolePaths, type AuthRole, useAuth } from "../auth/AuthContext";

export function ProtectedRoute({ allowedRole }: { allowedRole?: AuthRole }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && session.role !== allowedRole) {
    return <Navigate to={authRolePaths[session.role]} replace />;
  }

  return <Outlet />;
}
