import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { EntitlementsProvider } from './context/EntitlementsContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import ConsentBanner from './components/ConsentBanner';
import { useAuth } from './Hooks/useAuth';

// Eager-loaded (critical path, small size)
import Home from './pages/home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded (non-critical / heavy pages)
const Pollinisateurs = lazy(() => import('./pages/pollinisateur'));
const News = lazy(() => import('./pages/News'));
const Oceans = lazy(() => import('./pages/Educational/Oceans'));
const Reforestation = lazy(() => import('./pages/Educational/Reforestation'));
const Innovations = lazy(() => import('./pages/Educational/Innovations'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Donations = lazy(() => import('./pages/Donations'));
const Profile = lazy(() => import('./pages/Profile'));
const Marketplace = lazy(() => import('./pages/Marketplace'));

const PageLoader = () => (
  <div className="flex justify-center items-center py-32">
    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Handles the OAuth callback redirect from the backend
function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuth();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      navigate('/profile', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <EntitlementsProvider>
        <OfflineIndicator />
        <Layout>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/news" element={<News />} />

              {/* Educational pages - Public */}
              <Route path="/pollinisateurs" element={<Pollinisateurs />} />
              <Route path="/oceans" element={<Oceans />} />
              <Route path="/reforestation" element={<Reforestation />} />
              <Route path="/innovations" element={<Innovations />} />

              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />

              {/* Protected routes - require auth */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/marketplace" element={<Marketplace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Layout>
        <InstallPrompt />
        <ConsentBanner />
      </EntitlementsProvider>
    </AuthProvider>
  );
}

export default App;
