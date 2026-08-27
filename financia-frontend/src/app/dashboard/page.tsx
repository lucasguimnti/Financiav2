'use client';

import { useState } from 'react';

export default function DashboardPage() {
  // Estado simulado para validar a UX inicial (amanhã conectamos com a API real do Node.js)
  const [stats] = useState({
    safeMoney: 4500.00,
    totalBalance: 6200.00,
    pendingBills: 1700.00,
    creditCardInvoice: 1200.00,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Cabeçalho do Dashboard */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Visão Geral <span className="text-emerald-400">Financia</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Seu painel de controle financeiro inteligente
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
            Modo Premium Ativo
          </span>
        </div>
      </header>

      {/* Grid de Métricas Principais (O "Dinheiro Seguro" em destaque) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Dinheiro Seguro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dinheiro Seguro (Livre)
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-emerald-400">
              R$ {stats.safeMoney.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Já descontando todas as faturas e contas pendentes.
          </p>
        </div>

        {/* Card 2: Saldo Total Bruto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Saldo Total nas Contas
          </span>
          <div className="mt-3">
            <span className="text-3xl md:text-4xl font-extrabold text-white">
              R$ {stats.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Soma de todas as contas correntes cadastradas.
          </p>
        </div>

        {/* Card 3: Fatura do Cartão / Pendências */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fatura Atual do Cartão
          </span>
          <div className="mt-3">
            <span className="text-3xl md:text-4xl font-extrabold text-amber-400">
              R$ {stats.creditCardInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Inclui parcelamentos ativos (ex: 1/18).
          </p>
        </div>

      </div>

      {/* Seção de Ações Rápidas / Próxima Ação */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Ações do Sistema</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/10">
            + Nova Transação
          </button>
          <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all border border-slate-700">
            Pagar Fatura do Cartão
          </button>
        </div>
      </div>
    </div>
  );
}