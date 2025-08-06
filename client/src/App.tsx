
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './hooks/useAuth';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProfilePage from './pages/ProfilePage';
import SellPage from './pages/SellPage';
import MessagesPage from './pages/MessagesPage';
import FavoritesPage from './pages/FavoritesPage';
import OrdersPage from './pages/OrdersPage';
import SearchPage from './pages/SearchPage';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Styles
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
      
      {/* Routes protégées avec layout */}
      <Route path="/" element={
        <Layout>
          <HomePage />
        </Layout>
      } />
      
      <Route path="/product/:id" element={
        <Layout>
          <ProductDetailPage />
        </Layout>
      } />
      
      <Route path="/search" element={
        <Layout>
          <SearchPage />
        </Layout>
      } />
      
      <Route path="/sell" element={
        <ProtectedRoute>
          <Layout>
            <SellPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/messages" element={
        <ProtectedRoute>
          <Layout>
            <MessagesPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/favorites" element={
        <ProtectedRoute>
          <Layout>
            <FavoritesPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute>
          <Layout>
            <OrdersPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Route par défaut */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
