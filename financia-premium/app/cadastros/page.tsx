'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { Wallet, Tags, CreditCard, Plus, Building, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

interface Account { id: string; name: string; balance: string; }
interface Category { id: string; name: string; type: 'income' | 'expense'; color: string; }
interface Card { id: string; name: string; limit_amount: string; closing_day: number; due_day: number; color: string; }

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function CadastrosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'accounts' | 'categories' | 'cards'>('accounts');
  
  // Estados de Dados
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de Formulários
  const [accountForm, setAccountForm] = useState({ name: '', balance: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'expense', color: '#8b5cf6' });
  const [cardForm, setCardForm] = useState({ name: '', limit_amount: '', closing_day: '', due_day: '', color: '#3b82f6' });

  // Controle de Modal Global (Preparado para expansão)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<any>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [accRes, catRes, cardRes] = await Promise.all([
        api.get('/api/accounts'),
        api.get('/api/categories'),
        api.get('/api/credit-cards').catch(() => ({ data: [] }))
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      setCards(cardRes.data);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      // Proteção de Rota: Redireciona se o token estiver inválido/ausente
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  // ==========================================
  // UX: FECHAR MODAIS COM 'ESC' E CLIQUE FORA
  // ==========================================
  const closeModal = () => { setIsModalOpen(false); setModalContent(null); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ==========================================
  // HANDLERS DE SUBMISSÃO E EXCLUSÃO
  // ==========================================
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/accounts', { 
        name: accountForm.name, 
        balance: parseFloat(accountForm.balance.replace(',', '.')) || 0 
      });
      setAccountForm({ name: '', balance: '' }); // Reseta imediatamente
      fetchAllData();
    } catch (error) { alert('Erro ao criar conta'); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/categories', categoryForm);
      setCategoryForm({ name: '', type: categoryForm.type as any, color: categoryForm.color }); 
      fetchAllData();
    } catch (error) { alert('Erro ao criar categoria'); }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/credit-cards', {
        name: cardForm.name,
        limit_amount: parseFloat(cardForm.limit_amount.replace(',', '.')) || 0,
        closing_day: parseInt(cardForm.closing_day),
        due_day: parseInt(cardForm.due_day),
        color: cardForm.color
      });
      setCardForm({ name: '', limit_amount: '', closing_day: '', due_day: '', color: cardForm.color });
      fetchAllData();
    } catch (error) { alert('Erro ao criar cartão'); }
  };

  const handleDelete = (type: string, id: string, name: string) => {
    if(window.confirm(`Tem certeza que deseja excluir "${name}"? Todas as transações atreladas poderão perder a referência.`)) {
      alert(`Ação de exclusão para ${type} (ID: ${id}) solicitada.`);
      // Ex: await api.delete(`/api/${type}/${id}`); fetchAllData();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Comercial */}
        <header className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Motor de Configurações <span className="text-emerald-400"><Building size={28}/></span>
          </h1>
          <p className="text-slate-400 mt-2">
            Estruture suas finanças. Cadastre contas, categorias e cartões para habilitar a inteligência do Dashboard.
          </p>
        </header>

        {/* Sistema de Navegação (Tabs Premium) */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-xl w-fit border border-slate-800 backdrop-blur-sm">
          <button type="button" onClick={() => setActiveTab('accounts')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'accounts' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            <Wallet size={16} /> Contas Bancárias
          </button>
          <button type="button" onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'categories' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            <Tags size={16} /> Categorias
          </button>
          <button type="button" onClick={() => setActiveTab('cards')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'cards' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
            <CreditCard size={16} /> Cartões de Crédito
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA: Formulários Dinâmicos */}
          <div className="lg:col-span-4 h-fit space-y-6">
            
            {/* TAB: CONTAS */}
            {activeTab === 'accounts' && (
              <form onSubmit={handleCreateAccount} className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300 space-y-5">
                <h2 className="text-xl font-black flex items-center gap-2 border-b border-slate-700/50 pb-4 text-emerald-400"><Wallet size={20}/> Nova Conta</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nome da Instituição</label>
                  <input type="text" required value={accountForm.name} onChange={(e) => setAccountForm({...accountForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 outline-none text-white transition-all" placeholder="Ex: Itaú, Nubank, Safra..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Saldo Inicial (R$)</label>
                  <input type="number" step="0.01" required value={accountForm.balance} onChange={(e) => setAccountForm({...accountForm, balance: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-emerald-500 outline-none text-white font-bold transition-all" placeholder="0,00" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                    <Plus size={20} /> Adicionar Conta
                  </button>
                </div>
              </form>
            )}

            {/* TAB: CATEGORIAS */}
            {activeTab === 'categories' && (
              <form onSubmit={handleCreateCategory} className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300 space-y-5">
                <h2 className="text-xl font-black flex items-center gap-2 border-b border-slate-700/50 pb-4 text-purple-400"><Tags size={20}/> Nova Categoria</h2>
                
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/50">
                  <button type="button" onClick={() => setCategoryForm({...categoryForm, type: 'expense'})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${categoryForm.type === 'expense' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Despesa</button>
                  <button type="button" onClick={() => setCategoryForm({...categoryForm, type: 'income'})} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${categoryForm.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Receita</button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nome da Categoria</label>
                  <input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-purple-500 outline-none text-white transition-all" placeholder="Ex: Alimentação, Moradia..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Cor de Identificação</label>
                  <input type="color" value={categoryForm.color} onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})} className="w-full h-14 rounded-xl cursor-pointer bg-slate-900 border border-slate-700" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20">
                    <Plus size={20} /> Adicionar Categoria
                  </button>
                </div>
              </form>
            )}

            {/* TAB: CARTÕES */}
            {activeTab === 'cards' && (
              <form onSubmit={handleCreateCard} className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-sm animate-in fade-in duration-300 space-y-5">
                <h2 className="text-xl font-black flex items-center gap-2 border-b border-slate-700/50 pb-4 text-blue-400"><CreditCard size={20}/> Novo Cartão</h2>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Apelido do Cartão</label>
                  <input type="text" required value={cardForm.name} onChange={(e) => setCardForm({...cardForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white transition-all" placeholder="Ex: Black, Platinum, XP..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Limite Aprovado (R$)</label>
                    <input type="number" step="0.01" required value={cardForm.limit_amount} onChange={(e) => setCardForm({...cardForm, limit_amount: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white font-bold transition-all" placeholder="0,00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Fechamento</label>
                    <input type="number" min="1" max="31" required value={cardForm.closing_day} onChange={(e) => setCardForm({...cardForm, closing_day: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white transition-all" placeholder="Dia (Ex: 5)" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Vencimento</label>
                    <input type="number" min="1" max="31" required value={cardForm.due_day} onChange={(e) => setCardForm({...cardForm, due_day: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 outline-none text-white transition-all" placeholder="Dia (Ex: 12)" />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                    <Plus size={20} /> Adicionar Cartão
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* COLUNA DIREITA: Listagem (O reflexo do Banco de Dados) */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-inner relative overflow-hidden min-h-[500px]">
            <h3 className="text-lg font-black text-white mb-6 flex justify-between items-center pb-4 border-b border-slate-800">
              Inventário Ativo
              {loading && <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 animate-pulse">Sincronizando Banco...</span>}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* RENDER: CONTAS */}
              {activeTab === 'accounts' && accounts.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-10 italic">O cofre está vazio. Adicione uma conta.</p>}
              {activeTab === 'accounts' && accounts.map(acc => (
                <div key={acc.id} className="group flex flex-col justify-between p-5 bg-slate-800/40 hover:bg-slate-800 transition-all rounded-2xl border border-slate-700/50 hover:border-emerald-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-900/30 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20"><Wallet size={18}/></div>
                      <span className="font-bold text-slate-200 text-lg">{acc.name}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button type="button" className="text-slate-400 hover:text-white p-1"><Edit2 size={16}/></button>
                      <button type="button" onClick={() => handleDelete('accounts', acc.id, acc.name)} className="text-slate-400 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo em Caixa</span>
                    <span className="font-black text-2xl text-white">{formatCurrency(Number(acc.balance))}</span>
                  </div>
                </div>
              ))}

              {/* RENDER: CATEGORIAS */}
              {activeTab === 'categories' && categories.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-10 italic">Nenhuma categoria mapeada ainda.</p>}
              {activeTab === 'categories' && categories.map(cat => (
                <div key={cat.id} className="group flex justify-between items-center p-5 bg-slate-800/40 hover:bg-slate-800 transition-all rounded-2xl border border-slate-700/50 hover:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-8 rounded-md shadow-inner" style={{ backgroundColor: cat.color }}></div>
                    <div>
                      <span className="block font-bold text-slate-200 text-lg leading-tight">{cat.name}</span>
                      <span className={`text-[10px] font-black tracking-widest uppercase ${cat.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {cat.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     <button type="button" className="text-slate-400 hover:text-white p-1"><Edit2 size={16}/></button>
                     <button type="button" onClick={() => handleDelete('categories', cat.id, cat.name)} className="text-slate-400 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}

              {/* RENDER: CARTÕES */}
              {activeTab === 'cards' && cards.length === 0 && <p className="text-slate-500 text-sm col-span-full text-center py-10 italic">Nenhum cartão habilitado.</p>}
              {activeTab === 'cards' && cards.map(card => (
                <div key={card.id} className="group flex flex-col justify-between p-5 bg-gradient-to-br from-slate-800 to-slate-900 transition-all rounded-2xl border border-slate-700 relative overflow-hidden">
                  {/* Linha de Cor Decorativa Superior */}
                  <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: card.color }}></div>
                  
                  <div className="flex justify-between items-start mb-6 pt-1">
                    <span className="font-black text-slate-100 text-lg tracking-wide">{card.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-slate-900/80 rounded-lg p-1">
                      <button type="button" className="text-slate-400 hover:text-white p-1"><Edit2 size={14}/></button>
                      <button type="button" onClick={() => handleDelete('cards', card.id, card.name)} className="text-slate-400 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Vence dia {card.due_day}</span>
                      <span className="block text-xs font-medium text-slate-400">Fecha dia {card.closing_day}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Limite Aprovado</span>
                      <span className="font-black text-xl text-white">{formatCurrency(Number(card.limit_amount))}</span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>

      {/* MODAL GLOBAL GENÉRICO (Pronto para receber os Forms de Edição no futuro) */}
      {isModalOpen && (
        <div onClick={closeModal} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
             <button type="button" onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
             {modalContent}
          </div>
        </div>
      )}

    </div>
  );
}