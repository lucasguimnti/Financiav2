'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Target, Plus, TrendingUp, AlertTriangle, 
  Sparkles, Wallet, CheckCircle2, X, ChevronRight, Activity, Flame, ShieldCheck, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface Goal { id: number; name: string; target_amount: string; current_amount: string; color: string; deadline: string; }
interface Transaction { id: number; amount: string; type: 'income' | 'expense'; date: string; is_paid: boolean; credit_card_id?: number; }
interface Account { id: number; name: string; balance: string; }

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatCompact = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

export default function PlanejamentoPatrimonial() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Controle de Modais
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [aporteValue, setAporteValue] = useState('');
  const [isAporteOpen, setIsAporteOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', deadline: '', color: '#8b5cf6' });

  // Controle de Simulação (E se eu...?)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationExtra, setSimulationExtra] = useState(0);

  useEffect(() => { fetchData(); }, []);

  // =======================================================
  // UX: FECHAR MODAIS COM 'ESC'
  // =======================================================
  const closeAllModals = () => {
    setIsAporteOpen(false);
    setIsPlanOpen(false);
    setIsCreateOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAllModals();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, transRes, accRes] = await Promise.all([
        api.get('/api/goals'), api.get('/api/transactions'), api.get('/api/accounts')
      ]);
      setGoals(goalsRes.data); setTransactions(transRes.data); setAccounts(accRes.data);
    } catch (error) { 
      if ((error as any).response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // AÇÕES DA API
  // =======================================================
  const handleConfirmAporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !aporteValue) return;
    try {
      await api.put(`/api/goals/${selectedGoal.id}/add`, { amount: Number(aporteValue) });
      setIsAporteOpen(false); fetchData(); 
    } catch (error) { alert('Erro ao registrar o aporte.'); }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/goals', {
        name: newGoal.name,
        target_amount: Number(newGoal.target_amount),
        deadline: newGoal.deadline,
        color: newGoal.color
      });
      setIsCreateOpen(false);
      setNewGoal({ name: '', target_amount: '', deadline: '', color: '#8b5cf6' });
      fetchData();
    } catch (error) { alert('Erro ao criar objetivo.'); }
  };

  const handleDeleteGoal = async (id: number) => {
    if(!confirm("Tem certeza que deseja excluir este objetivo? O saldo será ignorado.")) return;
    try {
      await api.delete(`/api/goals/${id}`);
      setIsPlanOpen(false); fetchData();
    } catch (error) { alert("Erro ao excluir."); }
  };

  // =======================================================
  // MOTOR DE INTELIGÊNCIA FINANCEIRA & RITMO
  // =======================================================
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const currentBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
  const creditCardDebt = transactions.filter(t => t.credit_card_id && !t.is_paid).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
  const netWorth = currentBalance - creditCardDebt;

  const currentMonthIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr)).reduce((acc, t) => acc + Number(t.amount), 0);
  const currentMonthExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
  const savingsCapacity = currentMonthIncome > 0 ? Math.max(currentMonthIncome - currentMonthExpense, 0) : 0;
  
  // Enriquecimento das Metas
  const enrichedGoals = goals.map(g => {
    const current = Number(g.current_amount);
    const target = Number(g.target_amount);
    const diff = Math.max(target - current, 0);
    
    const deadlineDate = new Date(g.deadline);
    let monthsLeft = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());
    if (monthsLeft < 1) monthsLeft = 1; 

    const requiredPace = diff / monthsLeft;
    const perc = Math.min((current / target) * 100, 100);
    const isCompleted = current >= target;
    const isDelayed = !isCompleted && deadlineDate < now;

    let status = 'No ritmo certo';
    let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let dotColor = 'bg-emerald-400';

    if (isCompleted) {
      status = 'Objetivo Alcançado';
      statusColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      dotColor = 'bg-purple-400';
    } else if (isDelayed) {
      status = 'Prazo expirado';
      statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
      dotColor = 'bg-red-500';
    } else if (requiredPace > (savingsCapacity || 1)) {
      status = 'Abaixo do ritmo';
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      dotColor = 'bg-amber-400';
    }

    return { ...g, current, target, diff, monthsLeft, requiredPace, perc, status, statusColor, dotColor };
  });

  const totalRequiredPace = enrichedGoals.filter(g => !g.status.includes('Alcançado')).reduce((acc, g) => acc + g.requiredPace, 0);
  const goalsAtRisk = enrichedGoals.filter(g => g.status === 'Abaixo do ritmo' || g.status === 'Prazo expirado');
  const goalsOnTrack = enrichedGoals.filter(g => g.status === 'No ritmo certo' || g.status === 'Objetivo Alcançado');

  // Projeção Patrimonial
  const yearsToRetirement = 24; // Exemplo fixo até os 60 (horizonte padrão)
  const generateProjection = (years: number, addSimulation = false) => {
    const rate = 0.008; // ~0.8% a.m
    const months = years * 12;
    const baseInvest = savingsCapacity > 0 ? savingsCapacity : totalRequiredPace; 
    const monthlyInvest = addSimulation ? baseInvest + simulationExtra : baseInvest;
    
    const futureNetWorth = netWorth * Math.pow(1 + rate, months) + monthlyInvest * ((Math.pow(1 + rate, months) - 1) / rate);
    return Math.max(netWorth, futureNetWorth);
  };
  
  const projectionData = [
    { label: 'Hoje', valor: netWorth, simulado: netWorth },
    { label: '5 Anos', valor: generateProjection(5), simulado: generateProjection(5, true) },
    { label: '10 Anos', valor: generateProjection(10), simulado: generateProjection(10, true) },
    { label: '24 Anos (Aos 60)', valor: generateProjection(yearsToRetirement), simulado: generateProjection(yearsToRetirement, true) },
  ];

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-emerald-400">Calculando seu plano de vida...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8 text-white font-sans relative">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              Metas & Planejamento <TrendingUp className="text-emerald-400" size={28} />
            </h1>
            <p className="text-slate-400 mt-1">Transforme seus objetivos em um plano financeiro executável.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${isSimulating ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'}`}
            >
              {isSimulating ? 'Fechar Simulação' : 'Simular Cenários'}
            </button>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20">
              <Plus size={18} /> Criar Meta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Visão Macro & Alertas */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* O PLANO (Projeção) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 lg:p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden transition-all duration-500">
              <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={150} className="text-emerald-400"/></div>
              
              <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                <div className="lg:w-2/5 flex flex-col justify-center space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Wallet size={14}/> Seu Futuro Financeiro</p>
                    <p className="text-sm text-slate-500 mb-1">Patrimônio projetado (Longo Prazo)</p>
                    <h2 className="text-4xl font-black text-emerald-400">
                      {isSimulating ? formatCompact(generateProjection(yearsToRetirement, true)) : formatCompact(generateProjection(yearsToRetirement))}
                    </h2>
                    {isSimulating && simulationExtra > 0 && (
                      <p className="text-xs font-bold text-emerald-300 mt-2 bg-emerald-500/10 inline-block px-2 py-1 rounded">
                        +{formatCompact(generateProjection(yearsToRetirement, true) - generateProjection(yearsToRetirement))} no futuro!
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-700/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Aportes atuais:</span>
                      <span className="font-bold text-white">{formatCurrency(savingsCapacity)}/mês</span>
                    </div>
                    {isSimulating && (
                      <div className="pt-2">
                        <label className="text-xs font-bold text-emerald-400 mb-2 block">E se eu investir mais...</label>
                        <input 
                          type="range" min="0" max="5000" step="100" 
                          value={simulationExtra} onChange={(e) => setSimulationExtra(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs font-bold text-slate-400 mt-1">
                          <span>R$ 0</span>
                          <span className="text-emerald-400">+{formatCurrency(simulationExtra)}</span>
                          <span>R$ 5k</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:w-3/5 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip content={({active, payload}) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{payload[0].payload.label}</p>
                              <p className="text-sm text-slate-400 mb-1">Atual: <span className="font-bold text-white">{formatCompact(payload[0].value as number)}</span></p>
                              {isSimulating && (
                                <p className="text-sm text-emerald-400 font-bold">Simulação: {formatCompact(payload[1].value as number)}</p>
                              )}
                            </div>
                          )
                        }
                        return null;
                      }} />
                      <Area type="monotone" dataKey="valor" stroke="#94a3b8" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
                      {isSimulating && (
                        <Area type="monotone" dataKey="simulado" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSim)" strokeDasharray="5 5" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ALERTAS DE RISCO */}
            {goalsAtRisk.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <AlertTriangle className="text-amber-400" size={20}/> Atenção Necessária
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goalsAtRisk.map(goal => (
                    <div key={`risk-${goal.id}`} className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${goal.dotColor}`}></div>
                        <h4 className="font-bold text-amber-100">{goal.name}</h4>
                      </div>
                      <p className="text-sm text-amber-200/80 mb-4 leading-relaxed">
                        Você está <strong className="text-amber-400">{formatCurrency(goal.requiredPace - (savingsCapacity/goals.length))}</strong> abaixo do ritmo necessário por mês.
                      </p>
                      <button onClick={() => { setSelectedGoal(goal); setIsPlanOpen(true); }} className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                        Ajustar Plano <ChevronRight size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LISTA DE METAS */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Target className="text-purple-400" size={20}/> Seus Objetivos de Curto e Médio Prazo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrichedGoals.map(goal => (
                  <div key={goal.id} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm transition-all hover:border-slate-600 flex flex-col h-full">
                    
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-white">{goal.name}</h4>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(goal.current)} <span className="text-slate-500 font-medium">de {formatCurrency(goal.target)}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${goal.statusColor}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${goal.dotColor}`}></div> {goal.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>{goal.perc.toFixed(0)}% concluído</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${goal.perc}%`, backgroundColor: goal.color }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6 text-sm flex-1">
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Faltam</p>
                        <p className="font-bold text-white">{formatCurrency(goal.diff)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Aporte ideal</p>
                        <p className="font-bold text-white">{formatCurrency(goal.requiredPace)}/mês</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Previsão</p>
                        <p className="font-bold text-white capitalize">{new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-700/50 mt-auto">
                      <button onClick={() => handleOpenAporte(goal)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl font-bold transition-colors text-sm shadow-lg shadow-purple-500/20">
                        Aportar
                      </button>
                      <button onClick={() => { setSelectedGoal(goal); setIsPlanOpen(true); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-bold transition-colors text-sm">
                        Ver Plano →
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: Saúde do Plano */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="text-blue-400" size={20}/> Saúde do Plano
            </h3>
            
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center py-6 border-b border-slate-700/50 mb-6">
                <div className="text-5xl font-black text-white mb-2">
                  {enrichedGoals.length > 0 ? Math.round((goalsOnTrack.length / enrichedGoals.length) * 100) : 0}
                  <span className="text-2xl text-slate-500">/100</span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center leading-snug">Score de Execução<br/>Patrimonial</p>
              </div>

              <div className="space-y-4 mb-8">
                {enrichedGoals.map(g => (
                  <div key={`health-${g.id}`} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 truncate pr-4">{g.name}</span>
                    <span className={`font-bold shrink-0 flex items-center gap-1.5 ${g.status.includes('ritmo') || g.status.includes('Alcançado') ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${g.dotColor}`}></div>
                      {g.status}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push('/relatorios')} className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-slate-300 font-bold rounded-xl text-sm transition-colors border border-slate-700">
                Ver Diagnóstico Detalhado →
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: CRIAR META */}
      {isCreateOpen && (
        <div onClick={closeAllModals} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black text-white mb-6">Definir Novo Objetivo</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Sonho (Ex: Reserva, Viagem)</label>
                <input type="text" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Alvo (R$)</label>
                  <input type="number" required value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Data Limite</label>
                  <input type="date" required value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-extrabold shadow-lg shadow-purple-500/20">Salvar Plano</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER PLANO (Detalhes e Exclusão) */}
      {isPlanOpen && selectedGoal && (
        <div onClick={closeAllModals} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsPlanOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black text-white mb-2">Plano de Ação</h3>
            <p className="text-sm text-slate-400 mb-6">Gerencie o objetivo <strong className="text-white">{selectedGoal.name}</strong>.</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Status do Sistema</p>
                <p className="text-sm font-medium text-slate-200">
                  Para atingir {formatCurrency(Number(selectedGoal.target_amount))} até {new Date(selectedGoal.deadline).toLocaleDateString('pt-BR')}, você precisa aportar em média <strong className="text-emerald-400">{formatCurrency((selectedGoal as any).requiredPace)}/mês</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button onClick={() => handleDeleteGoal(selectedGoal.id)} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                <Trash2 size={16}/> Abandonar Objetivo
              </button>
              <button onClick={() => setIsPlanOpen(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APORTE */}
      {isAporteOpen && selectedGoal && (
        <div onClick={closeAllModals} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsAporteOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black text-white mb-2">Aportar no Objetivo</h3>
            <p className="text-sm text-slate-400 mb-6">Injetar fundos para <strong className="text-purple-400">{selectedGoal.name}</strong>.</p>

            <form onSubmit={handleConfirmAporte} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor do Aporte (R$)</label>
                <input 
                  type="number" step="0.01" required autoFocus placeholder="0,00"
                  value={aporteValue} onChange={e => setAporteValue(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-lg outline-none focus:border-purple-500" 
                />
              </div>

              <div className="bg-emerald-900/20 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5"/>
                <p className="text-xs text-emerald-300 font-medium">
                  Aportes consistentes são o segredo. O ritmo ideal indicado para esta meta é <strong>{formatCurrency((selectedGoal as any).requiredPace)}/mês</strong>.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsAporteOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold shadow-lg shadow-emerald-600/20">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}