'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard as CreditCardIcon, ChevronLeft, ChevronRight, 
  Calendar, CheckCircle2, Trash2, Wallet, 
  ArrowLeft, ShieldAlert, BarChart3, Users, DollarSign, X,
  Search, Download, Plus, Wifi, Layers, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';

// ==========================================
// INTERFACES
// ==========================================
interface Transaction {
  id: number; 
  description: string; 
  amount: string | number; 
  type: 'income' | 'expense';
  date: string; 
  is_paid: boolean; 
  credit_card_id?: number | string | null; 
  category_id?: number | string | null;
  third_party_id?: number | string | null; 
  third_party_name?: string; 
  third_party_color?: string;
  installment_number?: number; 
  installments?: number;
  payment_type?: string;   // <-- ADICIONE ESTA LINHA
}
interface CreditCard { id: number; name: string; limit_amount: string | number; closing_day: number; due_day: number; color: string; }
interface Account { id: number; name: string; balance: string | number; }
interface Category { id: number; name: string; type: 'income' | 'expense'; color: string; }
interface ThirdParty { id: number; name: string; color: string; }

// ==========================================
// UTILITÁRIOS
// ==========================================
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(value) ? 0 : value);
const formatDateBR = (dateString: string) => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  if (!datePart.includes('-')) return dateString;
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

// ==========================================
// MODAL: PAGAR FATURA
// ==========================================
const PayInvoiceModal = ({ isOpen, onClose, onSubmit, accounts, invoiceData, cardName }: any) => {
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/80">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><CheckCircle2 className="text-emerald-400" /> Pagar Fatura</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(accountId); setAccountId(''); }} className="p-6 space-y-5">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 text-center shadow-inner">
            <p className="text-sm text-slate-400 mb-1 font-medium">{cardName} - Fatura {invoiceData.month}/{invoiceData.year}</p>
            <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(invoiceData.total)}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">De qual conta vai sair?</label>
            <select required value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all">
              <option value="">Selecione a conta bancária...</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={!accountId}
            className={`w-full py-4 font-bold rounded-xl mt-4 transition-all ${accountId ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            Liquidar Fatura Agora
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODAL: NOVA DESPESA RÁPIDA NO CARTÃO
// ==========================================
const QuickAddModal = ({ isOpen, onClose, onSubmit, categories, thirdParties, cardName }: any) => {
  const [formData, setFormData] = useState({ description: '', amount: '', category_id: '', date: new Date().toISOString().split('T')[0], installments: 1, third_party_id: '' });
  
  useEffect(() => {
    if (isOpen) setFormData({ description: '', amount: '', category_id: '', date: new Date().toISOString().split('T')[0], installments: 1, third_party_id: '' });
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const expenseCategories = categories.filter((c: any) => c.type === 'expense');

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/80">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Plus className="text-purple-400" /> Nova Compra</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-4">
          <div className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20"><CreditCardIcon size={14}/> Destino: {cardName}</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Descrição</label>
              <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none transition-all" placeholder="Ex: Mercado Livre, iFood..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Valor (R$)</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-bold focus:border-purple-500 focus:outline-none transition-all" placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Parcelas</label>
              <select value={formData.installments} onChange={(e) => setFormData({...formData, installments: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none transition-all">
                <option value={1}>1x (À vista)</option>
                {[2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Categoria</label>
              <select required value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none transition-all">
                <option value="">Selecione...</option>
                {expenseCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Data da Compra</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none transition-all" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Terceiro (Opcional)</label>
              <select value={formData.third_party_id} onChange={(e) => setFormData({...formData, third_party_id: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-purple-500 focus:outline-none transition-all">
                <option value="">Meu próprio gasto (Nenhum)</option>
                {thirdParties.map((tp: any) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl mt-2 cursor-pointer transition-colors shadow-lg shadow-purple-500/20">
            Lançar no Cartão
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// TELA PRINCIPAL
// ==========================================
export default function CreditCardsCenter() {
  const router = useRouter();
  
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); 
  
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [invoice, setInvoice] = useState({ month: '', year: '', total: 0, is_paid: false, transactions: [] as Transaction[] });
  
  // Modais & Filtros
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para cadastro do novo cartão
  const [cardForm, setCardForm] = useState({ name: '', limit_amount: '', closing_day: 1, due_day: 10, color: '#8b5cf6' });

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [cardsRes, accRes, catRes, tpRes, transRes] = await Promise.all([
        api.get('/api/credit-cards'), api.get('/api/accounts'), api.get('/api/categories'),
        api.get('/api/third-parties'), api.get('/api/transactions')
      ]);
      setCards(cardsRes.data); setAccounts(accRes.data); setCategories(catRes.data);
      setThirdParties(tpRes.data); setAllTransactions(transRes.data);
      if (cardsRes.data.length > 0 && !selectedCardId) setSelectedCardId(cardsRes.data[0].id);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (selectedCardId) fetchInvoice(selectedCardId, currentDate);
  }, [selectedCardId, currentDate]);

  const fetchInvoice = async (cardId: number, date: Date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const res = await api.get(`/api/credit-cards/${cardId}/invoices/${year}/${month}`);
      setInvoice(res.data);
    } catch (error) { console.error(error); }
  };

  // Funções de Ação
  const handlePayInvoice = async (accountId: string) => {
    if (!selectedCardId || !accountId) return;
    try {
      await api.post(`/api/credit-cards/${selectedCardId}/invoices/pay`, { year: currentDate.getFullYear(), month: String(currentDate.getMonth() + 1).padStart(2, '0'), account_id: accountId });
      setIsPayModalOpen(false); fetchInitialData(); fetchInvoice(selectedCardId, currentDate);
    } catch (error) { alert('Erro ao pagar fatura.'); }
  };

  const handleQuickAdd = async (data: any) => {
    if (!selectedCardId) return;
    const amountNum = parseFloat(data.amount) || 0;
    const payload = {
      ...data, amount: -Math.abs(amountNum), type: 'expense', payment_type: 'credit_card',
      credit_card_id: selectedCardId, account_id: null, is_paid: false, third_party_id: data.third_party_id ? Number(data.third_party_id) : null
    };
    try {
      await api.post('/api/transactions', payload);
      setIsQuickAddOpen(false); fetchInitialData(); fetchInvoice(selectedCardId, currentDate);
    } catch (error) { alert('Erro ao lançar compra.'); }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/credit-cards', cardForm);
      setIsCardModalOpen(false);
      fetchInitialData();
    } catch (error) {
      alert('Erro ao criar cartão');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta compra? A fatura será recalculada.')) {
      try {
        await api.delete(`/api/transactions/${id}`);
        fetchInitialData(); if (selectedCardId) fetchInvoice(selectedCardId, currentDate);
      } catch (error) {}
    }
  };

  const exportInvoiceCSV = () => {
    if (invoice.transactions.length === 0) return alert('Fatura vazia.');
    const rows = invoice.transactions.map(t => `"${formatDateBR(t.date)}";"${t.description}";"${Math.abs(parseFloat(String(t.amount))).toFixed(2).replace('.', ',')}";"${t.third_party_name || 'Meu Gasto'}"`);
    const csvContent = '\uFEFFData;Descrição;Valor;Responsável\n' + rows.join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `Fatura_${selectedCard?.name}_${invoice.month}_${invoice.year}.csv`;
    link.click();
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Cálculos Globais
  const globalTotalLimit = cards.reduce((acc, c) => acc + parseFloat(String(c.limit_amount)), 0);
  const globalUsedLimit = allTransactions.filter(t => t.payment_type === 'credit_card' && !t.is_paid).reduce((acc, t) => acc + Math.abs(parseFloat(String(t.amount))), 0);
  const globalAvailable = Math.max(0, globalTotalLimit - globalUsedLimit);

  // Cálculos do Cartão Atual (Garantindo tipagem com String)
  const selectedCard = cards.find(c => String(c.id) === String(selectedCardId));
  const totalLimit = selectedCard ? parseFloat(String(selectedCard.limit_amount)) : 0;
  const usedLimit = allTransactions.filter(t => String(t.credit_card_id) === String(selectedCardId) && !t.is_paid).reduce((acc, t) => acc + Math.abs(parseFloat(String(t.amount))), 0);
  const availableLimit = Math.max(0, totalLimit - usedLimit);
  const limitPercentage = totalLimit > 0 ? (usedLimit / totalLimit) * 100 : 0;

  // Cálculos da Fatura
  const thirdPartyExpenses = invoice.transactions.filter(t => t.third_party_id).reduce((acc, t) => acc + Math.abs(parseFloat(String(t.amount))), 0);
  const myExpenses = invoice.total - thirdPartyExpenses;
  
  let invoiceStatus = invoice.is_paid ? 'Paga' : 'Aberta';
  let statusColor = invoice.is_paid ? 'text-emerald-400 border-emerald-400' : 'text-blue-400 border-blue-400';
  if (!invoice.is_paid && selectedCard) {
    const today = new Date();
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear() && today.getDate() >= selectedCard.closing_day) {
      invoiceStatus = 'Fechada'; statusColor = 'text-amber-400 border-amber-400';
    }
  }

  const projectionData = Array.from({length: 6}).map((_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    return {
      name: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
      value: allTransactions.filter(t => String(t.credit_card_id) === String(selectedCardId) && !t.is_paid && t.date.startsWith(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)).reduce((sum, t) => sum + Math.abs(parseFloat(String(t.amount))), 0),
      isCurrent: i === 0
    };
  });

  const filteredInvoiceTransactions = invoice.transactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.third_party_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6 lg:p-8 text-white font-sans selection:bg-purple-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER & GLOBAL SUMMARY */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium">
              <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center gap-3">
                Central de Cartões
              </h1>
              <button 
                onClick={() => setIsCardModalOpen(true)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 text-sm font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all shadow-md">
                <Plus size={16} /> Novo Cartão
              </button>
            </div>
          </div>
          
          {cards.length > 0 && (
            <div className="flex bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 shadow-lg backdrop-blur-sm gap-8 items-center w-full xl:w-auto">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Layers size={24}/></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Poder de Compra Global</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(globalTotalLimit)}</p>
                </div>
              </div>
              <div className="hidden md:block w-px h-12 bg-slate-700"></div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Disponível Total</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(globalAvailable)}</p>
              </div>
            </div>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-32 bg-slate-800/50 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
            <CreditCardIcon size={64} className="mx-auto text-slate-600 mb-6" />
            <h2 className="text-2xl font-bold text-slate-300">Nenhum cartão cadastrado</h2>
            <p className="text-slate-500 mt-2">Cadastre o seu primeiro cartão clicando no botão lá em cima.</p>
          </div>
        ) : !selectedCard ? (
          <div className="text-center py-32 bg-slate-800/50 rounded-3xl border border-slate-700/50">
            <h2 className="text-2xl font-bold text-slate-300">Carregando dados do cartão...</h2>
            <p className="text-slate-500 mt-2">Se esta tela travar, atualize a página (F5).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA: CONTROLE DO CARTÃO */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* CAROUSEL DE CARTÕES (Pills) */}
              <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 overflow-x-auto custom-scrollbar shadow-inner">
                {cards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCardId(card.id)} className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-300 ${selectedCardId === card.id ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
                    {card.name}
                  </button>
                ))}
              </div>
              
              {/* CARTÃO FÍSICO (UI Premium Apple Card style) */}
              <div className="relative h-56 rounded-3xl p-6 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group border border-white/10 transform transition-transform hover:scale-[1.02] duration-300" style={{ background: `linear-gradient(135deg, ${selectedCard.color} 0%, #0f172a 120%)` }}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-xl font-black tracking-widest text-white drop-shadow-md">{selectedCard.name.toUpperCase()}</h2>
                    <p className="text-white/50 text-xs tracking-widest mt-1 font-mono">**** **** **** 8921</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <CreditCardIcon className="text-white/80" size={28} />
                    <Wifi className="text-white/60 rotate-90" size={20} />
                  </div>
                </div>
                
                <div className="relative z-10 flex justify-between items-end">
                  <div className="w-12 h-9 rounded bg-gradient-to-br from-amber-200/80 to-amber-500/80 border border-amber-100/30 flex items-center justify-center opacity-80">
                    <div className="w-8 h-5 border border-amber-900/20 rounded-sm"></div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px] tracking-widest uppercase font-bold mb-0.5">Fechamento: Dia {selectedCard.closing_day}</p>
                    <p className="text-white/60 text-[10px] tracking-widest uppercase font-bold">Vencimento: Dia {selectedCard.due_day}</p>
                  </div>
                </div>
              </div>

              {/* BARRA DE LIMITE NEON */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-slate-200 font-bold flex items-center gap-2"><ShieldAlert size={18} className="text-purple-400"/> Limite do Cartão</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-900 rounded-lg text-slate-400">Total: {formatCurrency(totalLimit)}</span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-black text-white tracking-tight">{formatCurrency(usedLimit)}</span>
                    <span className="text-sm font-medium text-emerald-400 mb-1">Livre: {formatCurrency(availableLimit)}</span>
                  </div>
                  <div className="relative h-4 w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${limitPercentage > 90 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : limitPercentage > 70 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]'}`}
                      style={{ width: `${Math.min(limitPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* GRÁFICO PROJEÇÃO */}
                <div className="pt-6 border-t border-slate-700/50 mt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart3 size={14}/> Impacto Futuro (6 Meses)</h4>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectionData}>
                        <RechartsTooltip cursor={{ fill: 'rgba(30,41,59,0.5)' }} content={({active, payload, label}) => {
                          if(active && payload?.length) return (
                            <div className="bg-slate-800/90 backdrop-blur border border-slate-600 p-3 rounded-xl shadow-2xl">
                              <p className="text-slate-300 text-xs font-bold mb-1">{label}</p>
                              <p className="text-white font-black">{formatCurrency(payload[0].value as number)}</p>
                            </div>
                          ); return null;
                        }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {projectionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isCurrent ? selectedCard.color : '#334155'} className="transition-all duration-300 hover:opacity-80" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: A FATURA (Área de Trabalho) */}
            <div className="xl:col-span-8 bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col h-[calc(100vh-140px)] min-h-[700px] overflow-hidden relative">
              
              {/* CABEÇALHO DA FATURA */}
              <div className="p-6 md:p-8 border-b border-slate-700/50 bg-gradient-to-b from-slate-800/80 to-transparent">
                
                {/* Controles do Topo (Mês, Exportar, Add) */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                  <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
                    <div className="flex items-center justify-center min-w-[150px] gap-2 text-lg font-bold text-white capitalize">
                      <Calendar className="text-purple-400" size={18} />
                      {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronRight size={20} /></button>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={exportInvoiceCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors border border-slate-600">
                      <Download size={16} /> <span className="hidden md:inline">Baixar</span>
                    </button>
                    <button onClick={() => setIsQuickAddOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20">
                      <Plus size={16} /> Compra
                    </button>
                  </div>
                </div>

                {/* Resumo de Valores da Fatura */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Total da Fatura</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-widest ${statusColor} bg-slate-900/50`}>
                        {invoiceStatus}
                      </span>
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter">{formatCurrency(invoice.total)}</h2>
                  </div>

                  {invoice.total > 0 && (
                    <div className="flex gap-6 bg-slate-900/60 p-5 rounded-2xl border border-slate-700/50 shadow-inner w-full md:w-auto">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1"><Wallet size={14} className="text-blue-400"/> Meus Gastos</p>
                        <p className="text-xl font-black text-slate-200">{formatCurrency(myExpenses)}</p>
                      </div>
                      <div className="w-px bg-slate-700/50"></div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1"><Users size={14} className="text-amber-400"/> Terceiros</p>
                        <p className="text-xl font-black text-amber-400">{formatCurrency(thirdPartyExpenses)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de Pagar (Flutuante) */}
                {!invoice.is_paid && invoice.total > 0 && (
                  <div className="mt-8">
                    <button onClick={() => setIsPayModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-emerald-950 font-black text-lg rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform hover:-translate-y-1">
                      <DollarSign size={24} /> Pagar {formatCurrency(invoice.total)}
                    </button>
                  </div>
                )}
              </div>

              {/* LISTA DE COMPRAS (Com Busca) */}
              <div className="p-4 md:p-6 border-b border-slate-700/50">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar compra por nome ou familiar..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 md:p-4 custom-scrollbar">
                {invoice.transactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><CheckCircle2 size={40} className="text-slate-600" /></div>
                    <p className="text-lg font-medium">Nenhuma compra nesta fatura.</p>
                  </div>
                ) : filteredInvoiceTransactions.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">Nenhum resultado para "{searchQuery}"</div>
                ) : (
                  <div className="space-y-2">
                    {filteredInvoiceTransactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30 border border-transparent hover:border-slate-700/50 hover:bg-slate-800/60 transition-all group">
                        
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700/50 text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-colors">
                            <ArrowUpRight size={20} />
                          </div>
                          <div>
                            <p className="text-slate-200 font-bold text-base md:text-lg flex items-center gap-2">
                              {t.description}
                              {t.installments && t.installments > 1 && (
                                <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
                                  {t.installment_number}/{t.installments}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-medium text-slate-500">{formatDateBR(t.date)}</span>
                              {t.third_party_name && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider" style={{ backgroundColor: t.third_party_color || '#3b82f6' }}>
                                  {t.third_party_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="text-lg font-black text-white group-hover:text-red-400 transition-colors">
                            {formatCurrency(Math.abs(parseFloat(String(t.amount))))}
                          </p>
                          {!invoice.is_paid && (
                            <button onClick={() => handleDeleteTransaction(t.id)} className="text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 bg-slate-900 rounded-lg border border-slate-700" title="Apagar da fatura">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      <PayInvoiceModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} onSubmit={handlePayInvoice} accounts={accounts} invoiceData={invoice} cardName={selectedCard?.name} />
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onSubmit={handleQuickAdd} categories={categories} thirdParties={thirdParties} cardName={selectedCard?.name} />
      
      {/* MODAL DE NOVO CARTÃO */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><CreditCardIcon className="text-purple-400"/> Cadastrar Novo Cartão</h3>
            
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Nome do Cartão</label>
                <input type="text" placeholder="Ex: Nubank, Inter..." required value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-all" />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Limite Total (R$)</label>
                <input type="number" step="0.01" placeholder="0,00" required value={cardForm.limit_amount} onChange={e => setCardForm({...cardForm, limit_amount: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Dia do Fechamento</label>
                  <input type="number" required min="1" max="31" value={cardForm.closing_day} onChange={e => setCardForm({...cardForm, closing_day: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Dia do Vencimento</label>
                  <input type="number" required min="1" max="31" value={cardForm.due_day} onChange={e => setCardForm({...cardForm, due_day: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block uppercase font-bold tracking-wide">Cor do Cartão</label>
                <div className="flex gap-2">
                  {['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#64748b', '#0f172a'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCardForm({...cardForm, color})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${cardForm.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 cursor-pointer'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20 cursor-pointer">
                Salvar Cartão
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}