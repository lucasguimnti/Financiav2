'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, Target, Plus, CreditCard, Sparkles, Activity,
  ChevronLeft, ChevronRight, CheckCircle2, Clock,
  ArrowDownToLine, ArrowUpFromLine, HeartHandshake, AlertCircle, TrendingUp, Handshake
} from 'lucide-react';
import { api } from '../services/api';

interface Transaction { id: number; amount: string; type: 'income' | 'expense'; date: string; is_paid: boolean; credit_card_id?: number; category_id?: number; }
interface Account { id: number; name: string; balance: string; }
interface Goal { id: number; name: string; target_amount: string; current_amount: string; color: string; deadline: string; }
interface CreditCardData { id: number; name: string; limit_amount: string; }
interface TimelineItem { id: string; description: string; amount: number; type: string; due_date: string; day: number; is_paid: boolean; credit_card_id: string | null; source: string; }

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatCompact = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

export default function DashboardPsicologico() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<CreditCardData[]>([]);
  
  const [timelineDate, setTimelineDate] = useState(new Date());
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [transRes, accRes, goalsRes, cardsRes] = await Promise.all([
        api.get('/api/transactions'), api.get('/api/accounts'),
        api.get('/api/goals'), api.get('/api/credit-cards')
      ]);
      setTransactions(transRes.data); setAccounts(accRes.data);
      setGoals(goalsRes.data); setCards(cardsRes.data);
      fetchTimeline(new Date());
    } catch (error) { 
      if ((error as any).response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (dateObj: Date) => {
    setLoadingTimeline(true);
    try {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const res = await api.get(`/api/timeline?year=${year}&month=${month}`);
      setTimelineItems(res.data);
    } catch (error) { console.error(error); } 
    finally { setLoadingTimeline(false); }
  };

  const handleNextMonth = () => {
    if (loadingTimeline) return;
    const nextDate = new Date(timelineDate.getFullYear(), timelineDate.getMonth() + 1, 1);
    setTimelineDate(nextDate); fetchTimeline(nextDate);
  };

  const handlePrevMonth = () => {
    if (loadingTimeline) return;
    const prevDate = new Date(timelineDate.getFullYear(), timelineDate.getMonth() - 1, 1);
    setTimelineDate(prevDate); fetchTimeline(prevDate);
  };

  // ==========================================
  // O NOVO CÉREBRO (Focado no Presente)
  // ==========================================
  const currentMonthStr = `${timelineDate.getFullYear()}-${String(timelineDate.getMonth() + 1).padStart(2, '0')}`;
  
  // 1. Entradas (O que já pingou ou está agendado pra entrar)
  const realIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr)).reduce((acc, t) => acc + Number(t.amount), 0);
  const projectedIncome = timelineItems.filter(t => t.type === 'income' && t.source === 'subscription').reduce((acc, t) => acc + t.amount, 0);
  const totalEntradas = realIncome + projectedIncome;

  // 2. Saídas (O que já saiu + O que vai sair obrigatoriamente)
  const realExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
  const projectedExpense = timelineItems.filter(t => t.type === 'expense' && t.source === 'subscription').reduce((acc, t) => acc + t.amount, 0);
  const totalSaidas = realExpense + projectedExpense;

  // 3. O Respiro (Sobra Livre)
  const sobraLivre = totalEntradas - totalSaidas;

  // Dívida Acumulada de Cartão
  const creditCardDebt = transactions.filter(t => t.credit_card_id && !t.is_paid).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
  const currentBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

  // ==========================================
  // CONSELHEIRO COMPORTAMENTAL (Psicologia)
  // ==========================================
  const conselhos = [];
  
  if (totalEntradas === 0 && totalSaidas === 0) {
    conselhos.push({ type: 'neutral', icon: Handshake, text: "Bem-vindo ao novo mês! Registre sua primeira movimentação ou deixe as assinaturas trabalharem por você." });
  } else if (sobraLivre > 0) {
    conselhos.push({ type: 'positive', icon: Sparkles, text: `Mês no verde! Você tem uma margem de ${formatCurrency(sobraLivre)}. Considere direcionar uma parte para as suas Metas e separe o restante para aproveitar o presente sem culpa.` });
  } else if (sobraLivre < 0) {
    conselhos.push({ type: 'attention', icon: AlertCircle, text: `Seu orçamento está sob pressão este mês (${formatCurrency(sobraLivre)}). Não se culpe, imprevistos acontecem. Foque em reduzir gastos não essenciais nas próximas semanas.` });
  }

  if (creditCardDebt > currentBalance && currentBalance > 0) {
    conselhos.push({ type: 'warning', icon: CreditCard, text: `Atenção amiga: As faturas abertas superam o seu saldo atual em conta. Dê uma conferida na agenda financeira ao lado para se programar.` });
  }

  const monthName = timelineDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const incomeBarWidth = totalEntradas > 0 ? '100%' : '0%';
  
  // Correção Matemática: Se não houver entrada, mas houver saída, a barra de saída deve preencher 100%
  const expenseBarWidth = totalEntradas > 0 
    ? `${Math.min((totalSaidas / totalEntradas) * 100, 100)}%` 
    : (totalSaidas > 0 ? '100%' : '0%');

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-emerald-400 font-bold">Preparando seu ambiente...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8 text-white font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER ACOLHEDOR */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              Visão Geral <Sparkles className="text-purple-400" size={24} />
            </h1>
            <p className="text-slate-400 mt-1">Onde você está agora. O amanhã a gente cuida depois.</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button type="button" onClick={() => router.push('/metas')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-700">
              <Target size={16} /> Meus Sonhos
            </button>
            <button type="button" onClick={() => router.push('/lancamentos?action=new')} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20">
              <Plus size={16} /> Transação
            </button>
          </div>
        </div>

        {/* FUNIL FINANCEIRO (A Régua de Clareza) */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${loadingTimeline ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><ArrowDownToLine size={14}/> Tudo que entrou</p>
              <h2 className="text-2xl font-black text-white">{formatCurrency(totalEntradas)}</h2>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><ArrowUpFromLine size={14}/> Custo Total (Real + Previsto)</p>
              <h2 className="text-2xl font-black text-white">{formatCurrency(totalSaidas)}</h2>
            </div>
          </div>
          
          <div className={`p-5 rounded-3xl border backdrop-blur-sm flex flex-col justify-between ${sobraLivre >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2 ${sobraLivre >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <Activity size={14}/> Sobra Livre (O Respiro)
              </p>
              <h2 className={`text-2xl font-black ${sobraLivre >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {sobraLivre >= 0 ? '+' : ''}{formatCurrency(sobraLivre)}
              </h2>
            </div>
            {sobraLivre >= 0 ? (
              <p className="text-xs text-emerald-400/80 mt-2 font-medium">Dinheiro liberado e sem culpa.</p>
            ) : (
              <p className="text-xs text-red-400/80 mt-2 font-medium">Necessário readequação.</p>
            )}
          </div>

          <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2"><CreditCard size={14}/> Faturas Abertas</p>
              <h2 className="text-2xl font-black text-amber-400">{formatCompact(creditCardDebt)}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Lembre-se de pagar em dia.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA (Comportamento & Raio-X) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* O SEU ASSISTENTE */}
            <div className={`bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden transition-opacity duration-300 ${loadingTimeline ? 'opacity-50' : 'opacity-100'}`}>
              <div className="absolute top-0 right-0 p-8 opacity-10"><HeartHandshake size={100} className="text-purple-400"/></div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Conselheiro Financeiro</h3>
              
              <div className="space-y-3 relative z-10">
                {conselhos.map((cons, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border flex gap-4 items-start ${
                    cons.type === 'attention' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
                    cons.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' :
                    cons.type === 'warning' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                    'bg-blue-500/10 border-blue-500/30 text-blue-200'
                  }`}>
                    <div className="mt-1"><cons.icon size={24} /></div>
                    <p className="text-sm font-medium leading-relaxed">{cons.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* O RAIO-X DO MÊS */}
            <div className={`bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm transition-opacity duration-300 ${loadingTimeline ? 'opacity-50' : 'opacity-100'}`}>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6">Termômetro do Mês</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-400">Total de Entradas</span>
                    <span className="text-emerald-400">{formatCurrency(totalEntradas)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{width: incomeBarWidth}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-400">Total Comprometido (Real + Fixo)</span>
                    <span className={totalSaidas > totalEntradas ? 'text-red-400' : 'text-amber-400'}>{formatCurrency(totalSaidas)}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 flex">
                    <div className={`h-full rounded-full transition-all duration-1000 ${totalSaidas > totalEntradas ? 'bg-red-500' : 'bg-amber-400'}`} style={{width: expenseBarWidth}}></div>
                  </div>
                  {totalSaidas > totalEntradas && (
                     <p className="text-xs text-red-400 mt-2 font-bold text-right">
                       {totalEntradas > 0 
                         ? `Você excedeu sua renda em ${((totalSaidas/totalEntradas)*100 - 100).toFixed(1)}%`
                         : "Atenção: Existem despesas mapeadas sem nenhuma renda prevista para cobri-las."}
                     </p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA (A Agenda Híbrida - O que amamos fica) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col h-full max-h-[700px]">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16}/> Agenda Financeira
                </h3>
              </div>

              <div className="flex justify-between items-center bg-slate-800 p-2 rounded-xl mb-4 border border-slate-700">
                <button 
                  type="button" 
                  onClick={handlePrevMonth} 
                  disabled={loadingTimeline}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18}/>
                </button>
                <span className="text-sm font-black text-white capitalize">{monthName}</span>
                <button 
                  type="button" 
                  onClick={handleNextMonth} 
                  disabled={loadingTimeline}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18}/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {loadingTimeline ? (
                  <div className="text-center py-10 text-slate-500 text-sm animate-pulse">Sincronizando agenda...</div>
                ) : timelineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl h-32">
                    <p className="text-sm font-medium">Agenda livre em {monthName}.</p>
                  </div>
                ) : (
                  timelineItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className={`flex items-start justify-between p-3 rounded-xl border transition-all hover:bg-slate-800/80 ${item.source === 'subscription' ? 'bg-purple-900/10 border-purple-500/20' : 'bg-slate-800 border-slate-700/50'}`}>
                      
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                          item.is_paid 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : item.source === 'subscription' 
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}>
                          {item.is_paid ? <CheckCircle2 size={16} className="mb-0.5"/> : <span className="text-xs font-bold leading-none">Dia</span>}
                          <span className="text-sm font-black leading-none">{item.day}</span>
                        </div>
                        
                        <div>
                          <p className={`text-sm font-bold truncate max-w-[140px] md:max-w-[180px] ${item.is_paid ? 'text-slate-500 line-through' : 'text-slate-200'}`} title={item.description}>
                            {item.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.credit_card_id ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Cartão</span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">Conta</span>
                            )}
                            {item.source === 'subscription' && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1"><Clock size={10}/> Fixo</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className={`text-sm font-black shrink-0 ${item.is_paid ? 'text-slate-500' : item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </p>

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}