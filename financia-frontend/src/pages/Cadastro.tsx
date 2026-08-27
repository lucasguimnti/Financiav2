// src/pages/Cadastro.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // O useNavigate nos permite redirecionar o usuário via código
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Faz o POST para a rota de criação de usuário do nosso backend
      await api.post('/api/users', { name, email, password });
      
      alert('Conta criada com sucesso! Você já pode fazer login.');
      
      // Redireciona o usuário de volta para a tela de login
      navigate('/login');
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      if (error.response && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Erro ao tentar criar a conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">Financia</h1>
          <p className="text-slate-400">Crie sua conta para começar</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-900/50 border border-red-500 text-red-200 text-sm text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Como quer ser chamado?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="Mínimo de 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:text-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 mt-2"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          Já tem uma conta? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Entrar</Link>
        </p>
      </div>
    </div>
  );
}