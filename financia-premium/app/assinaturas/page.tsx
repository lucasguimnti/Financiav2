'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Repeat, Plus, PauseCircle, PlayCircle, Trash2, 
  CreditCard as CreditCardIcon, Landmark,
  MonitorPlay, Cloud, Edit2, X, Wallet, ShieldCheck, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface Subscription { id: string; description: string; amount: string; type: string; category_id: string | null; account_id: string | null; credit_card_id: string | null; frequency: string; due_day: number; status: string; }
interface Category { id: string; name: string; color: string; icon: string; type: string; }
interface Account { id: string; name: string; }
interface CreditCard { id: string; name: string; }

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function Assinaturas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  // =======================================================
  // UX: FECHAR MODAIS COM 'ESC'
  // =======================================================
  const closeAllModals = () => {
    setIsFormOpen(false);
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
      const [subsRes, catRes, accRes, cardRes] = await Promise.all([
        api.get('/api/subscriptions'), api.get('/api/categories'),
        api.get('/api/accounts'), api.get('/api/credit-cards')
      ]);
      setSubs(subsRes.data); setCategories(catRes.data);
      setAccounts(accRes.data); setCards(cardRes.data);
    } catch (error) {
      if ((error as any).response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (sub: Subscription | null = null) => {
    if (sub) {
      setFormData({
        description: sub.description,
        amount: Math.abs(Number(sub.amount)),
        type: sub.type || 'expense',
        category_id: sub.category_id || '',
        due_day: sub.due_day,
        frequency: sub.frequency || 'monthly',
        account_id: sub.account_id,
        credit_card_id: sub.credit_card_id,
      });
      setEditingId(sub.id);
    } else {
      setFormData({ 
        description: '', 
        amount: '', 
        type: 'expense', 
        category_id: '',
        due_day: 1, 
        frequency: 'monthly', 
        start_date: new Date().toISOString().split('T')[0], 
        account_id: null, 
        credit_card_id: null 
      });
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, amount: Math.abs(Number(formData.amount)) };
      if (editingId) {
        await api.put(`/api/subscriptions/${editingId}`, payload);
      } else {
        await api.post('/api/subscriptions', payload);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) { console.error(error); }
  };

  const toggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      await api.put(`/api/subscriptions/${sub.id}`, { status: newStatus });
      fetchData();
    } catch (error) {}
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Excluir esta assinatura definitivamente? As projeções futuras serão apagadas.')) {
      try { await api.delete(`/api/subscriptions/${id}`); fetchData(); } catch (error) {}
    }
  };

  const totalMensalDespesa = subs.filter(s => s.status === 'active' && s.type === 'expense').reduce((acc, s) => acc + Number(s.amount), 0);
  const totalMensalReceita = subs.filter(s => s.status === 'active' && s.type === 'income').reduce((acc, s) => acc + Number(s.amount), 0);

  const getSelectValue = () => {
    if (formData.account_id) return `acc_${formData.account_id}`;
    if (formData.credit_card_id) return `card_${formData.credit_card_id}`;
    return "";
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-emerald-400 flex items-center justify-center">Organizando seus compromissos mensais...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8 text-white font-sans relative">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              Rotina Financeira <Repeat className="text-purple-400" size={28} />
            </h1>
            <p className="text-slate-400 mt-1">Gerencie seu custo de vida automático e provisões.</p>
          </div>
          <button onClick={() => handleOpenForm()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all">
            <Plus size={18} /> Novo Compromisso Fixo
          </button>
        </div>

        {/* DASHBOARDS MACRO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-center">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><MonitorPlay size={14}/> Custo Fixo (Ativo)</p>
             <h2 className="text-3xl font-black text-red-400">{formatCurrency(totalMensalDespesa)}</h2>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-center">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Wallet size={14}/> Receita Fixa (Ativa)</p>
             <h2 className="text-3xl font-black text-emerald-400">{formatCurrency(totalMensalReceita)}</h2>
          </div>
          <div className="bg-purple-900/20 border border-purple-500/20 p-6 rounded-3xl backdrop-blur-sm flex flex-col justify-center">
             <div className="flex items-start gap-3">
               <ShieldCheck size={24} className="text-purple-400 shrink-0"/>
               <div>
                  <p className="text-sm text-purple-300 font-medium leading-snug">O sistema projeta essas transações no fluxo de caixa para você nunca esquecer um pagamento.</p>
               </div>
             </div>
          </div>
        </div>

        {/* LISTA DE RECORRÊNCIAS */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            Compromissos Mapeados
          </h3>
          
          {subs.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50">
              <Cloud size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-300">Sua agenda está livre.</h3>
              <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">Adicione assinaturas (Spotify, Netflix) ou contas fixas (Luz, Aluguel).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {subs.map(sub => (
                <div key={sub.id} className={`flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border transition-all ${sub.status === 'active' ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner shrink-0 ${sub.status === 'active' ? (sub.type === 'income' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-600 text-purple-400') : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                      {sub.type === 'income' ? <Wallet size={20} /> : <MonitorPlay size={20} />}
                    </div>
                    <div>
                      <h4 className={`text-lg font-bold ${sub.status === 'active' ? 'text-white' : 'text-slate-500 line-through'}`}>{sub.description}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                        Vence dia {sub.due_day}
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        {sub.credit_card_id ? (
                          <span className="flex items-center gap-1 text-blue-400"><CreditCardIcon size={12}/> Cartão</span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400"><Landmark size={12}/> Conta</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <p className={`text-lg font-black ${sub.status === 'active' ? (sub.type === 'income' ? 'text-emerald-400' : 'text-white') : 'text-slate-500'}`}>
                      {sub.type === 'income' ? '+' : ''}{formatCurrency(Number(sub.amount))}
                    </p>
                    
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(sub)} className={`p-2.5 rounded-xl transition-colors ${sub.status === 'active' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`} title={sub.status === 'active' ? 'Pausar Assinatura' : 'Reativar Assinatura'}>
                        {sub.status === 'active' ? <PauseCircle size={18}/> : <PlayCircle size={18}/>}
                      </button>
                      <button onClick={() => handleOpenForm(sub)} className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors border border-slate-600" title="Editar">
                        <Edit2 size={18}/>
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors" title="Excluir">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PADRONIZADO (FECHA COM ESC OU CLIQUE FORA) */}
      {isFormOpen && (
        <div onClick={closeAllModals} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black text-white mb-6">
              {editingId ? 'Editar Recorrência' : 'Nova Recorrência'}
            </h3>
            
            <form onSubmit={handleSaveForm} className="space-y-5">
              
              {/* Toggle Despesa/Receita */}
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Despesa Fixa</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>Receita Fixa</button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Descrição do Compromisso</label>
                <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500" placeholder="Ex: Spotify, Aluguel, Salário..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor (R$)</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Vencimento (Dia)</label>
                  <input type="number" min="1" max="31" required value={formData.due_day} onChange={e => setFormData({...formData, due_day: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Categoria</label>
                  <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500">
                    <option value="">Selecione...</option>
                    {categories.filter(c => c.type === formData.type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Origem/Destino</label>
                  <select 
                    value={getSelectValue()} required
                    onChange={e => {
                      const val = e.target.value;
                      if (val.startsWith('acc_')) setFormData({...formData, account_id: val.replace('acc_', ''), credit_card_id: null});
                      else if (val.startsWith('card_')) setFormData({...formData, credit_card_id: val.replace('card_', ''), account_id: null});
                      else setFormData({...formData, credit_card_id: null, account_id: null});
                    }} 
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-500"
                  >
                    <option value="">Onde?</option>
                    {accounts.length > 0 && (
                      <optgroup label="Contas (Débito/Dinheiro)">
                        {accounts.map(a => <option key={`acc_${a.id}`} value={`acc_${a.id}`}>{a.name}</option>)}
                      </optgroup>
                    )}
                    {cards.length > 0 && (
                      <optgroup label="Cartões de Crédito">
                        {cards.map(c => <option key={`card_${c.id}`} value={`card_${c.id}`}>{c.name}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20">
                  {editingId ? 'Salvar Edição' : 'Salvar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}