// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, LogOut, Plus, Pencil, Trash2, CreditCard, Tags, ChevronLeft, ChevronRight, Calendar, User, CheckCircle2, Clock, PieChart as PieChartIcon, BarChart2, Landmark, Download } from 'lucide-react';
import { api } from '../services/api';

import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import AccountModal from '../components/AccountModal';
import CategoryModal from '../components/CategoryModal';
import TransactionModal from '../components/TransactionModal';
import CreditCardModal from '../components/CreditCardModal'; // NOVO IMPORT

const formatCurrency = (value: number) => {
  const safeValue = isNaN(value) ? 0 : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeValue);
};

const formatDateBR = (dateString: string) => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  if (!datePart.includes('-')) return dateString;
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-red-400 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-white font-medium border-b border-slate-700 pb-2 mb-2">{label}</p>
        <p className="text-emerald-400 font-medium text-sm flex justify-between gap-4">
          <span>Receitas:</span> <span>{formatCurrency(payload[0]?.value || 0)}</span>
        </p>
        <p className="text-red-400 font-medium text-sm flex justify-between gap-4 mt-1">
          <span>Despesas:</span> <span>{formatCurrency(payload[1]?.value || 0)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false); // NOVO
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [transactions, setTransactions] = useState<any[]>([]); 
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]); // NOVO
  
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  const [formData, setFormData] = useState({description: '', amount: '', type: 'expense', date: '', account_id: '', category_id: '', credit_card_id: '', installments: 1, payment_type: 'account', is_paid: true});
  const [accountData, setAccountData] = useState({ name: '', balance: '' });
  const [categoryData, setCategoryData] = useState({ name: '', type: 'expense', color: '#10b981' });
  const [cardData, setCardData] = useState({ name: '', limit_amount: '', closing_day: '', due_day: '', color: '#8b5cf6' }); // NOVO

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // NOVO: Adicionamos a busca de cartões de crédito na chamada inicial
      const [transRes, accRes, catRes, cardRes] = await Promise.all([
        api.get('/api/transactions', config),
        api.get('/api/accounts', config),
        api.get('/api/categories', config),
        api.get('/api/credit-cards', config)
      ]);
      
      setTransactions(transRes.data || []);
      setAccounts(accRes.data || []);
      setCategories(catRes.data || []);
      setCreditCards(cardRes.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const [year, month] = t.date.split('T')[0].split('-');
    const currentYearStr = currentDate.getFullYear().toString();
    const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const isSameMonth = year === currentYearStr && month === currentMonthStr;

    const matchAccount = filterAccount === 'all' || String(t.account_id) === filterAccount;
    const matchType = filterType === 'all' || t.type === filterType;

    return isSameMonth && matchAccount && matchType;
  });

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Nenhuma transação para exportar neste mês.");
      return;
    }

    const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Status'];
    
    const rows = filteredTransactions.map(t => {
      const categoryName = categories.find(c => String(c.id) === String(t.category_id))?.name || 'Sem Categoria';
      const accountName = accounts.find(a => String(a.id) === String(t.account_id))?.name || 'Sem Conta';
      const date = formatDateBR(t.date);
      const type = t.type === 'income' ? 'Receita' : 'Despesa';
      const status = t.is_paid ? 'Pago' : 'Pendente';
      const amount = Math.abs(parseFloat(t.amount) || 0).toFixed(2).replace('.', ',');
      
      return `"${date}";"${t.description}";"${categoryName}";"${accountName}";"${type}";"${amount}";"${status}"`;
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Financia_Extrato_${formattedMonthName.replace(' ', '_')}.csv`;
    link.click();
  };

  const accountsWithBalances = accounts.map(acc => {
    const accTransactions = transactions.filter(t => String(t.account_id) === String(acc.id) && t.is_paid);
    
    const currentBalance = accTransactions.reduce((sum, t) => {
      const val = Math.abs(parseFloat(t.amount) || 0);
      return t.type === 'income' ? sum + val : sum - val;
    }, parseFloat(acc.balance || 0));

    return { ...acc, currentBalance };
  });

  const totalEffectiveBalance = accountsWithBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);

  const summary = filteredTransactions.reduce((acc, transaction) => {
    const amount = parseFloat(transaction.amount) || 0;
    if (transaction.type === 'income') {
      acc.income += amount;
    } else {
      acc.expenses += Math.abs(amount);
    }
    return acc;
  }, { income: 0, expenses: 0 });

  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], transaction) => {
      const category = categories.find(c => String(c.id) === String(transaction.category_id));
      const catName = category ? category.name : 'Outros';
      const catColor = category ? category.color : '#64748b';
      const amount = Math.abs(parseFloat(transaction.amount) || 0);

      if (amount <= 0) return acc;

      const existingCategory = acc.find(item => item.name === catName);
      if (existingCategory) {
        existingCategory.value += amount;
      } else {
        acc.push({ name: catName, value: amount, color: catColor });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const monthlyData = transactions.reduce((acc: any[], transaction) => {
    if (!transaction.date) return acc;
    const dateString = transaction.date.split('T')[0];
    if (!dateString.includes('-')) return acc;

    const [year, month] = dateString.split('-');
    const monthYearKey = `${year}-${month}`; 

    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    const formattedName = isNaN(dateObj.getTime()) 
      ? 'Mês' 
      : (dateObj.toLocaleString('pt-BR', { month: 'short' }).charAt(0).toUpperCase() + dateObj.toLocaleString('pt-BR', { month: 'short' }).slice(1).replace('.', '')); 

    let existing = acc.find((item: any) => item.key === monthYearKey);
    if (!existing) {
      existing = { key: monthYearKey, name: formattedName, income: 0, expense: 0 };
      acc.push(existing);
    }

    const amount = Math.abs(parseFloat(transaction.amount) || 0);
    if (transaction.type === 'income') {
      existing.income += amount;
    } else {
      existing.expense += amount;
    }
    return acc;
  }, [])
  .sort((a: any, b: any) => a.key.localeCompare(b.key)) 
  .slice(-6); 

  const openNewTransactionModal = () => {
    setFormData({ description: '', amount: '', type: 'expense', date: '', account_id: '', category_id: '', is_paid: false });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: any) => {
    const dateForInput = transaction.date ? transaction.date.split('T')[0] : ''; 
    setFormData({
      description: transaction.description || '',
      amount: Math.abs(parseFloat(transaction.amount) || 0).toString(),
      type: transaction.type,
      date: dateForInput,
      account_id: transaction.account_id || '',
      category_id: transaction.category_id || '',
      is_paid: transaction.is_paid
    });
    setEditingId(transaction.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        await fetchData(); 
      } catch (error) {}
    }
  };

  const togglePaymentStatus = async (transaction: any) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/transactions/${transaction.id}`, { ...transaction, is_paid: !transaction.is_paid }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (error) {}
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNumber = parseFloat(formData.amount) || 0;
    const finalAmount = formData.type === 'expense' ? -Math.abs(amountNumber) : Math.abs(amountNumber);
    
    const payload = { 
      ...formData, 
      amount: finalAmount, 
      account_id: formData.account_id || null, 
      category_id: formData.category_id || null 
    };

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingId) await api.put(`/api/transactions/${editingId}`, payload, config);
      else await api.post('/api/transactions', payload, config);
      setIsModalOpen(false);
      await fetchData(); 
    } catch (error) {}
  };

  const openEditAccountModal = (account: any) => {
    setAccountData({ name: account.name, balance: account.balance.toString() });
    setEditingAccountId(account.id);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { name: accountData.name, balance: parseFloat(accountData.balance) || 0 };

      if (editingAccountId) {
        await api.put(`/api/accounts/${editingAccountId}`, payload, config);
      } else {
        await api.post('/api/accounts', payload, config);
      }
      
      setIsAccountModalOpen(false);
      setAccountData({ name: '', balance: '' });
      setEditingAccountId(null);
      await fetchData(); 
    } catch (error) {}
  };

  const handleOpenNewAccountModal = () => {
    setAccountData({ name: '', balance: '' });
    setEditingAccountId(null);
    setIsAccountModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/categories', categoryData, { headers: { Authorization: `Bearer ${token}` } });
      setIsCategoryModalOpen(false);
      setCategoryData({ name: '', type: 'expense', color: '#10b981' });
      await fetchData(); 
    } catch (error) {}
  };

  // NOVO: Função para salvar o cartão de crédito
  const handleCreateCreditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/credit-cards', cardData, { headers: { Authorization: `Bearer ${token}` } });
      setIsCreditCardModalOpen(false);
      setCardData({ name: '', limit_amount: '', closing_day: '', due_day: '', color: '#8b5cf6' });
      await fetchData(); 
    } catch (error) {}
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white relative">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Meu Painel</h1>
            <div className="flex items-center gap-4 mt-3 bg-slate-800 p-2 rounded-lg border border-slate-700 w-fit">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"><ChevronLeft size={20} /></button>
              <div className="flex items-center gap-2 min-w-[140px] justify-center text-slate-200 font-medium"><Calendar size={16} className="text-emerald-400" />{formattedMonthName}</div>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"><ChevronRight size={20} /></button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* NOVO: Botão de adicionar cartão */}
            <button onClick={() => setIsCreditCardModalOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-400 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-700 text-sm"><CreditCard size={18} /> + Cartão</button>
            
            <button onClick={handleOpenNewAccountModal} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-700 text-sm"><Landmark size={18} /> + Conta</button>
            <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-colors font-medium border border-slate-700 text-sm"><Tags size={18} /> + Categoria</button>
            <button onClick={openNewTransactionModal} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-emerald-500/20"><Plus size={20} /> Nova Transação</button>
            
            <div className="relative">
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center justify-center w-10 h-10 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-full transition-colors font-medium border border-slate-700 ml-2"><User size={18} /></button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700"><p className="text-sm font-medium text-white">Meu Perfil</p></div>
                  <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-slate-700/50 transition-colors"><LogOut size={16} /> Sair do sistema</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div><p className="text-slate-400 font-medium mb-1">Saldo Efetivo</p><h2 className={`text-3xl font-bold ${totalEffectiveBalance < 0 ? 'text-red-400' : 'text-white'}`}>{formatCurrency(totalEffectiveBalance)}</h2></div>
              <div className="p-3 bg-blue-500/20 rounded-lg"><Wallet className="text-blue-400" size={24} /></div>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div><p className="text-slate-400 font-medium mb-1">Receitas (Mês)</p><h2 className="text-3xl font-bold text-emerald-400">{formatCurrency(summary.income)}</h2></div>
              <div className="p-3 bg-emerald-500/20 rounded-lg"><TrendingUp className="text-emerald-400" size={24} /></div>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div><p className="text-slate-400 font-medium mb-1">Despesas (Mês)</p><h2 className="text-3xl font-bold text-red-400">{formatCurrency(summary.expenses)}</h2></div>
              <div className="p-3 bg-red-500/20 rounded-lg"><TrendingDown className="text-red-400" size={24} /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="text-emerald-400" size={24} />
              <h2 className="text-xl font-bold text-slate-200">Despesas por Categoria</h2>
            </div>
            
            {expensesByCategory.length > 0 ? (
              <div className="flex justify-center items-center w-full mt-2">
                <PieChart width={300} height={250}>
                  <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm h-[250px]">Nenhuma despesa para exibir no gráfico.</div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 lg:col-span-2 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-slate-200">Transações Recentes</h2>
              
              <div className="flex gap-3 w-full md:w-auto">
                <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="all">Todas as Contas</option>
                  {accounts.map(acc => (<option key={acc.id} value={String(acc.id)}>{acc.name}</option>))}
                </select>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="all">Entradas e Saídas</option>
                  <option value="income">Apenas Receitas</option>
                  <option value="expense">Apenas Despesas</option>
                </select>
                
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors font-medium border border-slate-600 text-sm"
                  title="Exportar para Excel"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto h-[300px] overflow-y-auto pr-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-800 z-10">
                  <tr className="border-b border-slate-700 text-slate-400 text-sm">
                    <th className="pb-3 font-medium px-4">Status / Data</th>
                    <th className="pb-3 font-medium px-4">Descrição</th>
                    <th className="pb-3 font-medium px-4">Categoria</th>
                    <th className="pb-3 font-medium px-4 text-right">Valor</th>
                    <th className="pb-3 font-medium px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">Nenhuma transação encontrada.</td></tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const category = categories.find(c => String(c.id) === String(transaction.category_id));
                      const account = accounts.find(a => String(a.id) === String(transaction.account_id));

                      return (
                        <tr key={transaction.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="py-4 px-4 text-slate-400 text-sm flex items-center gap-3">
                             <button onClick={() => togglePaymentStatus(transaction)} className={`transition-colors ${transaction.is_paid ? 'text-emerald-500 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-500'}`}>
                               {transaction.is_paid ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                             </button>
                             <span className={transaction.is_paid ? '' : 'text-yellow-500 font-medium'}>{formatDateBR(transaction.date)}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-200 font-medium">
                            {transaction.description}
                            {account && <div className="flex items-center gap-1 text-xs text-slate-400 mt-1"><CreditCard size={12} /> {account.name}</div>}
                            {!transaction.is_paid && (
                              <div className="text-xs text-yellow-500/80 mt-1 font-normal">
                                {transaction.type === 'income' ? 'Aguardando recebimento' : 'Aguardando pagamento'}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {category ? (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold border flex items-center w-fit gap-1" style={{ backgroundColor: `${category.color}20`, color: category.color, borderColor: `${category.color}50` }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></div>{category.name}
                              </span>
                            ) : (<span className="text-slate-500 text-xs">-</span>)}
                          </td>
                          <td className={`py-4 px-4 text-right font-bold ${!transaction.is_paid ? 'opacity-60' : ''} ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {transaction.type === 'income' ? '+ ' : '- '}{formatCurrency(Math.abs(parseFloat(transaction.amount) || 0))}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handleEdit(transaction)} className="text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={18} /></button>
                              <button onClick={() => handleDelete(transaction.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 lg:col-span-2 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="text-blue-400" size={24} />
              <h2 className="text-xl font-bold text-slate-200">Evolução Financeira (Últimos 6 meses)</h2>
            </div>
            
            {monthlyData.length > 0 ? (
              <div className="flex justify-center w-full overflow-x-auto mt-4">
                <BarChart width={600} height={250} data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                  <YAxis hide={true} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#1e293b' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="income" name="Receitas" fill="#34d399" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="expense" name="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </div>
            ) : (
              <div className="w-full h-[250px] flex items-center justify-center text-slate-500 text-sm">
                Nenhum histórico para exibir.
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Landmark className="text-indigo-400" size={24} />
              <h2 className="text-xl font-bold text-slate-200">Minhas Contas e Cartões</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
              {/* LISTA DE CONTAS CORRENTES */}
              {accountsWithBalances.map(acc => (
                <div key={acc.id} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Landmark className="text-indigo-400" size={18} />
                    </div>
                    <p className="text-slate-200 font-medium">{acc.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <p className={`font-bold ${acc.currentBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(acc.currentBalance)}
                    </p>
                    <button 
                      onClick={() => openEditAccountModal(acc)} 
                      className="text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                      title="Editar conta"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* NOVO: LISTA DE CARTÕES DE CRÉDITO */}
              {creditCards.length > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-700/50">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-2">Cartões de Crédito</h3>
                  {creditCards.map(card => (
                    <div key={`card-${card.id}`} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${card.color}20` }}>
                          <CreditCard size={18} style={{ color: card.color }} />
                        </div>
                        <p className="text-slate-200 font-medium">{card.name}</p>
                      </div>
                      <p className="font-bold text-slate-300 text-sm">
                        Limite: {formatCurrency(parseFloat(card.limit_amount))}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {accounts.length === 0 && creditCards.length === 0 && (
                <p className="text-slate-500 text-sm text-center mt-4">Nenhuma conta ou cartão cadastrado.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        formData={formData} 
        setFormData={setFormData} 
        onSubmit={handleSaveTransaction} 
        isEditing={!!editingId} 
        accounts={accounts} 
        categories={categories} 
        creditCards={creditCards} // <--- ISSO AQUI FOI ADICIONADO
      />
      
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        accountData={accountData} 
        setAccountData={setAccountData} 
        onSubmit={handleSaveAccount} 
        isEditing={!!editingAccountId} 
      />
      
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categoryData={categoryData} setCategoryData={setCategoryData} onSubmit={handleCreateCategory} />

      {/* NOVO: Renderiza o modal de cartão de crédito */}
      <CreditCardModal
        isOpen={isCreditCardModalOpen}
        onClose={() => setIsCreditCardModalOpen(false)}
        cardData={cardData}
        setCardData={setCardData}
        onSubmit={handleCreateCreditCard}
      />
    </div>
  );
}