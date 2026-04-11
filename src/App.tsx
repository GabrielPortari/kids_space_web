import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { CompanySignupPage } from "./pages/CompanySignupPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LoginPage } from "./pages/LoginPage";
import { RoleWorkspacePage } from "./pages/RoleWorkspacePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppRedirect } from "./routes/AppRedirect";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup/company" element={<CompanySignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<AppRedirect />} />

          <Route element={<ProtectedRoute allowedRole="master-admin" />}>
            <Route
              path="/app/master-admin"
              element={<RoleWorkspacePage role="master-admin" />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRole="company" />}>
            <Route
              path="/app/company"
              element={<RoleWorkspacePage role="company" />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRole="collaborator" />}>
            <Route
              path="/app/collaborator"
              element={<RoleWorkspacePage role="collaborator" />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
