'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, PieChart as PieIcon, TrendingUp, ChevronLeft, ChevronRight, AlertCircle, Sparkles, BrainCircuit
} from 'lucide-react';
import { api } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface HistoryData { month: string; income: number; expense: number; }
interface CategoryData { name: string; value: number; color: string; }

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function Relatorios() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estado da IA
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => { fetchAnalytics(currentDate); }, []);

  const fetchAnalytics = async (date: Date) => {
    setLoading(true);
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      // 1. Busca os relatórios normais
      const res = await api.get(`/api/analytics?month=${month}&year=${year}`);
      setHistory(res.data.history);
      setCategories(res.data.categories);
      setLoading(false);

      // 2. Aciona o Cérebro da IA separadamente para não travar a tela
      fetchAiInsight(month, year);
      
    } catch (error: any) {
      if (error.response?.status === 401) router.push('/login');
      setLoading(false);
    }
  };

  const fetchAiInsight = async (month: number, year: number) => {
    setLoadingAi(true);
    try {
      const aiRes = await api.get(`/api/ai-insights?month=${month}&year=${year}`);
      setAiInsight(aiRes.data.insight);
    } catch (error) {
      console.error("Falha ao buscar IA:", error);
    } finally {
      setLoadingAi(false);
    }
  };

  const handlePrevMonth = () => {
    if (loading) return; // Evita requisições encavaladas
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate); fetchAnalytics(newDate);
  };

  const handleNextMonth = () => {
    if (loading) return;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate); fetchAnalytics(newDate);
  };

  const totalExpense = categories.reduce((acc, cat) => acc + cat.value, 0);

  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="text-slate-300 font-bold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-emerald-400">Entradas: {formatCurrency(payload[0].value)}</p>
            <p className="text-red-400">Saídas: {formatCurrency(payload[1].value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading && history.length === 0) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-emerald-400 font-bold">Processando inteligência de dados...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8 text-white font-sans selection:bg-purple-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              Analytics <BarChart3 className="text-blue-400" size={28} />
            </h1>
            <p className="text-slate-400 mt-1">Transformando seus números em inteligência visual.</p>
          </div>
        </div>

        {/* ========================================== */}
        {/* CARD VIP DA IA (O GPS FINANCEIRO)          */}
        {/* ========================================== */}
        <div className="bg-gradient-to-r from-purple-900/30 to-slate-900 border border-purple-500/30 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none"><BrainCircuit size={140} /></div>
          
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-4 relative z-10">
            <Sparkles size={16}/> Diagnóstico da Inteligência Artificial
          </h3>

          <div className="relative z-10 text-slate-300 text-sm leading-relaxed space-y-4 max-w-4xl">
            {loadingAi ? (
              <div className="flex items-center gap-3 animate-pulse text-purple-400 font-medium">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                Os conselheiros virtuais estão analisando seus dados de {currentDate.toLocaleString('pt-BR', { month: 'long' })}...
              </div>
            ) : aiInsight ? (
              <div dangerouslySetInnerHTML={{ __html: aiInsight }} />
            ) : (
              <p className="italic text-slate-500">Nenhum diagnóstico disponível no momento.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* GRÁFICO HISTÓRICO (BARRAS) */}
          <div className={`bg-slate-800/50 p-6 lg:p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6">
              <TrendingUp className="text-emerald-400" size={20}/> Evolução (Últimos 6 meses)
            </h3>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                  <RechartsTooltip content={<CustomTooltipBar />} cursor={{fill: '#1e293b'}} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO DE CATEGORIAS (ROSCA) */}
          <div className={`bg-slate-800/50 p-6 lg:p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col h-full transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <PieIcon className="text-purple-400" size={20}/> Gastos por Categoria
              </h3>
              
              <div className="flex justify-between items-center bg-slate-900 p-1.5 rounded-lg border border-slate-700 w-full sm:w-auto">
                <button type="button" onClick={handlePrevMonth} disabled={loading} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16}/></button>
                <span className="text-xs font-bold text-white px-3 capitalize">
                  {currentDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}
                </span>
                <button type="button" onClick={handleNextMonth} disabled={loading} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16}/></button>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
                <AlertCircle size={48} className="mb-4" />
                <p>Nenhuma despesa registrada neste mês.</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                <div className="h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#64748b'} className="transition-all duration-300 hover:opacity-80"/>
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((cat, idx) => {
                    const percentage = ((cat.value / totalExpense) * 100).toFixed(1);
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-700/30 rounded-lg transition-colors border border-transparent hover:border-slate-700/30 group">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color || '#64748b' }}></div>
                          <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{formatCurrency(cat.value)}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{percentage}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}