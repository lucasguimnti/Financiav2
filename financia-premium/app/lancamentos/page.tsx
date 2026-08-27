'use client';

import { useState, useEffect, useRef } from 'react';
import SmartImportModal from '../components/SmartImportModal';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, CheckCircle2, Clock, 
  CreditCard as CreditCardIcon, Landmark, 
  ArrowDownCircle, ArrowUpCircle, Users, 
  ChevronLeft, ChevronRight, Calendar, Info, 
  ArrowLeft, Download, X, Coins, Edit2, Trash2, Settings
} from 'lucide-react';
import { api } from '../services/api';

// ==========================================
// INTERFACES
// ==========================================
export interface Transaction {
  id: number; description: string; amount: string | number; type: 'income' | 'expense';
  date: string; is_paid: boolean; account_id?: number | string | null;
  category_id?: number | string | null; credit_card_id?: number | string | null;
  installments?: number; installment_number?: number; payment_type?: 'account' | 'credit_card' | 'debit';
  third_party_id?: number | string | null; third_party_name?: string;
  third_party_color?: string; is_reimbursed?: boolean;
}
export interface Account { id: number; name: string; balance: string | number; }
export interface Category { id: number; name: string; type: 'income' | 'expense'; color: string; }
export interface CreditCard { id: number; name: string; limit_amount: string | number; closing_day: number; due_day: number; color: string; }
export interface ThirdParty { id: number; name: string; color: string; }

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const getDayName = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0];
};

// ==========================================
// MODAL 1: IMPACTO FINANCEIRO (DETALHES)
// ==========================================
const TransactionDetailsModal = ({ isOpen, onClose, t, accounts, categories, onEdit, onDelete, onReimburse, onToggleStatus }: any) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !t) return null;

  const category = categories.find((c: any) => String(c.id) === String(t.category_id));
  const account = accounts.find((a: any) => String(a.id) === String(t.account_id));
  const isCard = t.payment_type === 'credit_card';
  const isThirdParty = Boolean(t.third_party_id);
  const amount = Math.abs(Number(t.amount));

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-700/50 flex flex-col animate-in slide-in-from-right-full">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Detalhes do Movimento</h3>
          <button type="button" onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
          
          <div className="text-center space-y-2">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
              {t.type === 'income' ? <ArrowDownCircle size={32}/> : <ArrowUpCircle size={32}/>}
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">{t.description}</h2>
            <p className={`text-4xl font-black tracking-tighter ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
              {formatCurrency(amount)}
            </p>
            {t.installments > 1 && (
              <span className="inline-block mt-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-slate-300">
                Parcela {t.installment_number} de {t.installments}
              </span>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Status</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest ${t.is_paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {t.is_paid ? 'Concluído' : 'Pendente'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Categoria</span>
              <span className="text-white font-medium flex items-center gap-2">
                {category && <div className="w-2 h-2 rounded-full" style={{background: category.color}}></div>}
                {category ? category.name : 'Não categorizado'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Origem</span>
              <span className="text-white font-medium flex items-center gap-2">
                {isCard ? <><CreditCardIcon size={14} className="text-purple-400"/> Cartão de Crédito</> : account ? <><Landmark size={14} className="text-blue-400"/> {account.name}</> : '-'}
              </span>
            </div>
            {isThirdParty && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Responsável</span>
                <span className="text-white font-bold px-2 py-0.5 rounded text-xs uppercase" style={{background: t.third_party_color || '#3b82f6'}}>
                  {t.third_party_name}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Impacto no Planejamento</h4>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 border border-slate-700 shadow-inner space-y-3">
              {isThirdParty ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Meu custo real no mês</span>
                    <span className="font-bold text-emerald-400">R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5"><Users size={14}/> A receber ({t.third_party_name})</span>
                    <span className="font-bold text-amber-400">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full h-px bg-slate-700/50 my-2"></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{isCard ? 'Impacto na Fatura' : 'Saiu da Conta'}</span>
                    <span className="font-bold text-red-400">{formatCurrency(amount)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Impacto no meu orçamento</span>
                    <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(amount)}
                    </span>
                  </div>
                  {!t.is_paid && !isCard && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-xs text-amber-300 font-medium">Este é um boleto/previsão pendente. Seu saldo bancário só será afetado quando você marcar como pago.</p>
                    </div>
                  )}
                  {isCard && (
                    <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <p className="text-xs text-purple-300 font-medium">Esta compra está na fatura do cartão e não afeta seu saldo bancário hoje.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-3">
          {isThirdParty && t.type === 'expense' && !t.is_reimbursed ? (
            <button type="button" onClick={() => { onClose(); onReimburse(t); }} className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-amber-950 font-black rounded-xl shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 transition-all">
              <Coins size={20} /> Registrar Pagamento de {t.third_party_name}
            </button>
          ) : (
            <button type="button" onClick={() => { onToggleStatus(t); onClose(); }} className={`w-full py-4 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${t.is_paid ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
              <CheckCircle2 size={20} /> {t.is_paid ? 'Marcar como Pendente' : (t.type === 'income' ? 'Marcar Recebimento' : 'Baixar Pagamento')}
            </button>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => { onClose(); onEdit(t); }} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors border border-slate-700">Editar</button>
            <button type="button" onClick={() => { onClose(); onDelete(t.id); }} className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl transition-colors border border-red-500/20">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MODAL 2: RECEBER REEMBOLSO
// ==========================================
const ReimburseModal = ({ isOpen, onClose, data, setData, onSubmit, accounts }: any) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-white flex items-center gap-2"><Coins className="text-amber-400" /> Receber Reembolso</h3>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <p className="text-sm text-slate-400 font-medium leading-relaxed">Ao confirmar, a pendência será zerada e uma receita será lançada automaticamente no seu extrato.</p>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Onde o dinheiro caiu?</label>
            <select required value={data.account_id} onChange={(e) => setData({...data, account_id: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none">
              <option value="">Selecione a conta...</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data do Recebimento</label>
            <input type="date" required value={data.date} onChange={(e) => setData({...data, date: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none" />
          </div>
          <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl mt-4 shadow-lg shadow-amber-500/20 transition-all">
            Confirmar Recebimento
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// TELA PRINCIPAL: CENTRAL DE MOVIMENTAÇÕES
// ==========================================
export default function Movimentacoes() {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]); 
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [activeFilter, setActiveFilter] = useState<'all'|'pending'|'receivable'|'cards'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reimburseData, setReimburseData] = useState({ transaction_id: null as number | null, account_id: '', date: '' });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense', color: '#3b82f6' });
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFormOpen && !isCategoryModalOpen && !isManageCategoriesOpen) setIsFormOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFormOpen, isCategoryModalOpen, isManageCategoriesOpen]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [transRes, accRes, catRes, cardRes, tpRes] = await Promise.all([
        api.get('/api/transactions'), api.get('/api/accounts'), api.get('/api/categories'),
        api.get('/api/credit-cards'), api.get('/api/third-parties')
      ]);
      setTransactions(transRes.data || []); setAccounts(accRes.data || []);
      setCategories(catRes.data || []); setCreditCards(cardRes.data || []);
      setThirdParties(tpRes.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) router.push('/login');
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [year, month] = t.date.split('T')[0].split('-');
    const isSameMonth = year === String(currentDate.getFullYear()) && month === String(currentDate.getMonth() + 1).padStart(2, '0');
    if (!isSameMonth) return false;

    if (activeFilter === 'pending' && t.is_paid) return false;
    if (activeFilter === 'receivable' && (!t.third_party_id || t.is_reimbursed || t.type !== 'expense')) return false;
    if (activeFilter === 'cards' && t.payment_type !== 'credit_card') return false;

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      return t.description.toLowerCase().includes(term) || (t.third_party_name && t.third_party_name.toLowerCase().includes(term));
    }
    return true;
  });

  const groupedTransactions = filteredTransactions.reduce((groups: any, t) => {
    const dateKey = t.date.split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
    return groups;
  }, {});
  
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const summary = {
    expenses: filteredTransactions.filter(t => t.type === 'expense' && !t.third_party_id).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
    cards: filteredTransactions.filter(t => t.payment_type === 'credit_card').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
    receivables: filteredTransactions.filter(t => t.third_party_id && !t.is_reimbursed).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
  };

  const handleOpenForm = (t: Transaction | null = null) => {
    if (t) {
      setFormData({ ...t, amount: Math.abs(Number(t.amount)), date: t.date.split('T')[0] });
      setEditingId(t.id);
    } else {
      setFormData({ description: '', amount: '', type: 'expense', date: new Date().toISOString().split('T')[0], account_id: '', category_id: '', installments: 1, payment_type: 'account', is_paid: true, third_party_id: null });
      setEditingId(null);
    }
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalIsPaid = formData.payment_type === 'credit_card' ? false : formData.is_paid;
    
    const payload = { 
      ...formData, 
      amount: formData.type === 'expense' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
      is_paid: finalIsPaid 
    };
    
    try {
      editingId ? await api.put(`/api/transactions/${editingId}`, payload) : await api.post('/api/transactions', payload);
      setIsFormOpen(false); fetchData();
    } catch (error) {}
  };

  // ----- FUNÇÕES DE GERENCIAMENTO DE CATEGORIA -----
  const handleOpenCategoryForm = (category: Category | null = null) => {
    if (category) {
      setCategoryForm({ name: category.name, type: category.type, color: category.color });
      setEditingCategoryId(category.id);
    } else {
      setCategoryForm({ name: '', type: 'expense', color: '#3b82f6' });
      setEditingCategoryId(null);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await api.put(`/api/categories/${editingCategoryId}`, categoryForm);
      } else {
        await api.post('/api/categories', categoryForm);
      }
      setIsCategoryModalOpen(false);
      fetchData(); 
    } catch (error) {
      alert('Erro ao salvar categoria');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Atenção: isso pode afetar lançamentos que já a utilizam.')) {
      try {
        await api.delete(`/api/categories/${id}`);
        fetchData();
      } catch (error) {
        alert('Erro ao excluir. Pode ser que esta categoria já esteja sendo usada em algum lançamento.');
      }
    }
  };
  // --------------------------------------------------

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir este lançamento permanentemente?')) {
      try { await api.delete(`/api/transactions/${id}`); fetchData(); } catch (error) {}
    }
  };

  const togglePaymentStatus = async (t: Transaction) => {
    if (t.payment_type === 'credit_card') {
      alert("Atenção: Para manter seu fluxo de caixa exato, as compras de cartão só mudam de status quando você 'Paga a Fatura' na Central de Cartões.");
      return;
    }
    try { await api.put(`/api/transactions/${t.id}`, { ...t, is_paid: !t.is_paid }); fetchData(); } catch (error) {}
  };

  const handleConfirmReimburse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/api/transactions/${reimburseData.transaction_id}/reimburse`, { is_reimbursed: true, account_id: reimburseData.account_id, date: reimburseData.date });
      setIsReimburseModalOpen(false); fetchData();
    } catch (error) {}
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8 text-white font-sans selection:bg-purple-500/30">
      
      <div className="max-w-4xl mx-auto mb-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button type="button" onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 text-sm font-bold transition-colors">
              <ArrowLeft size={16} /> Dashboard
            </button>
            <h1 className="text-3xl font-black text-white tracking-tight">Movimentações</h1>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
            <button type="button" className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors">
              <Download size={18} />
            </button>
            
            {/* BOTÃO DE CATEGORIAS MOVIDO PARA O TOPO */}
            <button type="button" onClick={() => setIsManageCategoriesOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 transition-colors">
              <Settings size={16} /> Categorias
            </button>
            
            <button type="button" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 transition-colors">
                Importar Planilha
            </button>
            
            <button type="button" onClick={() => handleOpenForm(null)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
              <Plus size={18} /> Novo Lançamento
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" placeholder="Buscar por descrição, pessoa ou local..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none placeholder:text-slate-500 shadow-inner"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending', label: 'Boletos Pendentes' },
              { id: 'receivable', label: 'Valores a Receber' },
              { id: 'cards', label: 'No Cartão' }
            ].map(f => (
              <button 
                type="button"
                key={f.id} onClick={() => setActiveFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === f.id ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/30">
          <button type="button" onClick={prevMonth} className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/50"><ChevronLeft size={20}/></button>
          <div className="flex items-center gap-2 text-lg font-bold text-white capitalize px-4">
            <Calendar size={18} className="text-emerald-400"/> {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
          <button type="button" onClick={nextMonth} className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/50"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-20">
        
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800 mb-8 shadow-inner">
          <div className="text-center px-4 border-r border-slate-800/50">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Seus Gastos</p>
            <p className="text-sm font-black text-red-400">{formatCurrency(summary.expenses)}</p>
          </div>
          <div className="text-center px-4 border-r border-slate-800/50">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Cartões</p>
            <p className="text-sm font-black text-purple-400">{formatCurrency(summary.cards)}</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">A Receber</p>
            <p className="text-sm font-black text-amber-400">{formatCurrency(summary.receivables)}</p>
          </div>
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 mb-4"><CheckCircle2 size={32} className="text-slate-600"/></div>
            <h3 className="text-xl font-bold text-slate-300">Nenhuma movimentação.</h3>
            <p className="text-slate-500 mt-2 text-sm">Seu fluxo está vazio para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 bg-[#0f172a]/90 backdrop-blur-md py-3 flex items-end gap-3 border-b border-slate-800/50 mb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">{getDayName(dateKey)}</h3>
                  <span className="text-xs font-medium text-slate-500">{dateKey.split('-').reverse().join('/')}</span>
                </div>
                
                <div className="space-y-2">
                  {groupedTransactions[dateKey].map((t: Transaction) => (
                    <div 
                      key={t.id} 
                      onClick={() => setSelectedTransaction(t)}
                      className="group flex items-center justify-between p-4 bg-slate-800/20 hover:bg-slate-800/60 rounded-2xl border border-transparent hover:border-slate-700/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner transition-colors ${t.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-slate-900 border-slate-700/50 text-slate-400 group-hover:border-slate-600'}`}>
                          {t.type === 'income' ? <ArrowDownCircle size={20}/> : <ArrowUpCircle size={20}/>}
                        </div>
                        
                        <div>
                          <p className="text-base font-bold text-slate-200 flex items-center gap-2">
                            {t.description}
                            {t.installments && t.installments > 1 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700">
                                {t.installment_number}/{t.installments}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-500">
                            {categories.find(c => String(c.id) === String(t.category_id))?.name || 'Sem categoria'}
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            {t.payment_type === 'credit_card' ? 'Cartão' : 'Conta'}
                            
                            {t.third_party_id && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span className="font-bold text-slate-300 uppercase">{t.third_party_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <p className={`text-lg font-black ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(t.amount)))}
                        </p>
                        
                        <div className="flex gap-2">
                          {!t.is_paid && (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider rounded">Pendente</span>
                          )}
                          {t.third_party_id && t.type === 'expense' && !t.is_reimbursed && (
                            <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-wider rounded">A Receber</span>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <SmartImportModal 
          isOpen={isImportModalOpen} 
          onClose={() => setIsImportModalOpen(false)} 
          onSuccess={fetchData} 
          categories={categories} 
          accounts={accounts}     
          cards={creditCards}
          thirdParties={thirdParties} 
        />
      </div>

      <TransactionDetailsModal 
        isOpen={!!selectedTransaction} 
        t={selectedTransaction} 
        accounts={accounts} 
        categories={categories}
        onClose={() => setSelectedTransaction(null)}
        onEdit={(t: any) => handleOpenForm(t)}
        onDelete={handleDelete}
        onToggleStatus={togglePaymentStatus}
        onReimburse={(t: any) => {
          setReimburseData({ transaction_id: t.id, account_id: '', date: new Date().toISOString().split('T')[0] });
          setIsReimburseModalOpen(true);
        }}
      />

      <ReimburseModal 
        isOpen={isReimburseModalOpen} onClose={() => setIsReimburseModalOpen(false)} 
        data={reimburseData} setData={setReimburseData} onSubmit={handleConfirmReimburse} accounts={accounts} 
      />

      {/* MODAL DO FORMULÁRIO DE LANÇAMENTO */}
      {isFormOpen && (
        <div onClick={() => setIsFormOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black text-white">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button type="button" onClick={() => setFormData({...formData, type: 'expense', payment_type: 'account'})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>Despesa</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income', payment_type: 'account', third_party_id: null})} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>Receita</button>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white text-2xl font-black focus:border-purple-500 focus:outline-none" placeholder="0,00" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descrição</label>
                  <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none" placeholder="Ex: Mercado" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none" />
                </div>
                
                {/* CAMPO DE CATEGORIA LIMPO - APENAS O SELECT */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Categoria</label>
                  <select required value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none">
                    <option value="">Selecione...</option>
                    {categories.filter(c => c.type === formData.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {formData.type === 'expense' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Meio de Pagamento</label>
                    <select value={formData.payment_type} onChange={(e) => setFormData({...formData, payment_type: e.target.value, account_id: '', credit_card_id: ''})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none">
                      <option value="account">Conta / Dinheiro</option>
                      <option value="credit_card">Cartão de Crédito</option>
                    </select>
                  </div>
                )}
              </div>

              {formData.type === 'expense' && formData.payment_type === 'account' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">De qual conta saiu?</label>
                  <select required value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none">
                    <option value="">Selecione a conta...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {formData.type === 'expense' && formData.payment_type === 'credit_card' && (
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Qual Cartão?</label>
                    <select required value={formData.credit_card_id} onChange={(e) => setFormData({...formData, credit_card_id: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none">
                      <option value="">Selecione...</option>
                      {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Parcelas</label>
                    <select required value={formData.installments} onChange={(e) => setFormData({...formData, installments: e.target.value})} disabled={!!editingId} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none">
                      <option value={1}>1x</option>
                      {[2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                </div>
              )}

              {formData.type === 'income' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Para qual conta vai?</label>
                  <select required value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none">
                    <option value="">Selecione a conta...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {formData.type === 'expense' && (
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" checked={!!formData.third_party_id} onChange={(e) => setFormData({...formData, third_party_id: e.target.checked && thirdParties.length > 0 ? String(thirdParties[0].id) : null})} className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-purple-500" />
                    <span className="text-sm font-bold text-white flex items-center gap-2"><Users size={16} className="text-purple-400"/> Compra de Terceiro (Reembolsável)</span>
                  </label>
                  {formData.third_party_id && (
                    <div className="mt-3">
                      <select value={formData.third_party_id} onChange={(e) => setFormData({...formData, third_party_id: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none">
                        <option value="">Quem comprou/vai pagar?</option>
                        {thirdParties.map(tp => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {formData.payment_type !== 'credit_card' && (
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" checked={formData.is_paid} onChange={(e) => setFormData({...formData, is_paid: e.target.checked})} className="w-5 h-5 rounded bg-slate-800 border-slate-600 cursor-pointer" />
                  <label className="text-sm font-bold text-slate-300 cursor-pointer" onClick={() => setFormData({...formData, is_paid: !formData.is_paid})}>{formData.type === 'income' ? 'Já recebi (Dinheiro na conta)' : 'Já paguei (Debitado da conta)'}</label>
                </div>
              )}

              <button type="submit" className={`w-full py-4 mt-4 font-black rounded-xl text-white shadow-lg transition-all ${formData.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}`}>
                {editingId ? 'Salvar Alterações' : 'Lançar Movimentação'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO DE CATEGORIAS */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-purple-400"/> Categorias</h3>
              <div className="flex items-center gap-3">
                {/* BOTAO + NOVA DENTRO DA JANELA DE CATEGORIAS */}
                <button onClick={() => handleOpenCategoryForm()} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-purple-500/20">
                  <Plus size={14} /> Nova
                </button>
                <button onClick={() => setIsManageCategoriesOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {['expense', 'income'].map((type) => {
                const typeCategories = categories.filter(c => c.type === type);
                if (typeCategories.length === 0) return null;
                return (
                  <div key={type}>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">
                      {type === 'expense' ? 'Despesas' : 'Receitas'}
                    </h4>
                    <div className="space-y-2">
                      {typeCategories.map(c => (
                        <div key={c.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color }}></div>
                            <span className="text-sm font-bold text-slate-200">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleOpenCategoryForm(c)} className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-md transition-colors" title="Editar">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO/EDIÇÃO DE NOVA CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Nome da Categoria</label>
                <input type="text" placeholder="Ex: Farmácia, Lazer..." required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-all" />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Tipo</label>
                <select required value={categoryForm.type} onChange={e => setCategoryForm({...categoryForm, type: e.target.value})} disabled={!!editingCategoryId} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-all disabled:opacity-50">
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#64748b', '#78716c'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({...categoryForm, color})}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${categoryForm.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 cursor-pointer'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20 cursor-pointer">
                {editingCategoryId ? 'Salvar Alterações' : 'Salvar Categoria'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}