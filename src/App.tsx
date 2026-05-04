import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import type { AuthRole } from "./auth/jwt";
import { authRolePaths } from "./auth/authRoles";
import { CompanySignupPage } from "./pages/CompanySignupPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LoginPage } from "./pages/LoginPage";
import { RoleWorkspacePage } from "./pages/workspace/RoleWorkspacePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppRedirect } from "./routes/AppRedirect";
import "./App.css";

const protectedRoles: AuthRole[] = [
  "master",
  "admin",
  "company",
  "collaborator",
];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup/company" element={<CompanySignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<AppRedirect />} />

          {protectedRoles.map((role) => (
            <Route key={role} element={<ProtectedRoute allowedRole={role} />}>
              <Route
                path={authRolePaths[role]}
                element={<RoleWorkspacePage role={role} />}
              />
            </Route>
          ))}

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
