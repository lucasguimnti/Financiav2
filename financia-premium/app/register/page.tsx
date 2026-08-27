'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../services/api';

export default function CadastroUsuarioPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Chama a rota do seu backend que cria o usuário no banco
      await api.post('/api/register', {
        name,
        email,
        password,
      });

      setSuccess('Conta criada com sucesso! Redirecionando para o login...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black text-white mb-2">Criar Conta</h1>
          <p className="text-slate-400 text-sm font-medium">Junte-se ao Financia</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Seu Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-emerald-500" placeholder="Seu nome" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-emerald-500" placeholder="seu@email.com" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-emerald-500" placeholder="••••••••" />
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">{error}</div>}
          {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm text-center">{success}</div>}

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-xl transition-all">
            {loading ? 'Criando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline text-sm">
            Já tem conta? Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}