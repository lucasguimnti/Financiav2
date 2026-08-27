// src/components/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';

// Esse componente recebe uma tela (children) e decide se mostra ou bloqueia
export default function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  
  // Se não tem token, chuta o usuário de volta pro login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Se tem token, deixa entrar na tela solicitada
  return children;
}