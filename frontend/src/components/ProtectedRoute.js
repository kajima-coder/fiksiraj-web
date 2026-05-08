import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-slate-600">Učitavanje...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/prijava" replace />;
  }

  return children;
};

export default ProtectedRoute;
