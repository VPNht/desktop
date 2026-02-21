import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuthStore } from "@stores";
import { Layout } from "@components/Layout";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Home } from "@pages/Home";
import { Servers } from "@pages/Servers";
import { Settings } from "@pages/Settings";
import { Login } from "@pages/Login";

// Code-split the Map component (maplibre-gl is ~800KB)
const Map = lazy(() => import("@pages/Map").then((m) => ({ default: m.Map })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/login"
          element=
            <PublicRoute>
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            </PublicRoute>
          
        />
        <Route
          path="/"
          element=
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          
        >
          <Route
            index
            element=
              <ErrorBoundary>
                <Home />
              </ErrorBoundary>
            
          />
          <Route
            path="servers"
            element=
              <ErrorBoundary>
                <Servers />
              </ErrorBoundary>
            
          />
          <Route
            path="map"
            element=
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Map />
                </Suspense>
              </ErrorBoundary>
            
          />
          <Route
            path="settings"
            element=
              <ErrorBoundary>
                <Settings />
              </ErrorBoundary>
            
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;