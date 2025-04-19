import { Navigate } from 'react-router-dom';

// Função para verificar autenticação armazenada
const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  const wallet = localStorage.getItem('wallet_address');
  return !!(token && wallet);
};

// Componente para rotas protegidas
export function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    console.log('Acesso negado: Usuário não autenticado. Redirecionando para /app');
    return <Navigate to="/app" replace />;
  }
  return children;
}

export default ProtectedRoute; 