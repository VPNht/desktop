import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@stores";
import { Layout } from "@components/Layout";
import { Home } from "@pages/Home";
import { Servers } from "@pages/Servers";
import { Map } from "@pages/Map";
import { Settings } from "@pages/Settings";
import { Login } from "@pages/Login";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="servers" element={<Servers />} />
        <Route path="map" element={<Map />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
