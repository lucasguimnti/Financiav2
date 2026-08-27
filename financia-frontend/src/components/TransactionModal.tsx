// src/components/TransactionModal.tsx
import { X } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  accounts: any[];
  categories: any[];
  creditCards: any[]; // NOVO
}

export default function TransactionModal({ isOpen, onClose, formData, setFormData, onSubmit, isEditing, accounts, categories, creditCards }: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-200">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button type="button" onClick={() => setFormData({...formData, type: 'expense', payment_type: 'account'})} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Despesa</button>
            <button type="button" onClick={() => setFormData({...formData, type: 'income', payment_type: 'account'})} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Receita</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
            <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200" placeholder="Ex: Mercado, Salário" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
              <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200" placeholder="0,00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Data</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
            <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} required className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
              <option value="">Selecione uma categoria...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {/* ESCOLHER ENTRE CONTA OU CARTÃO (Só aparece para Despesas) */}
          {formData.type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Método de Pagamento</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center text-slate-300 text-sm cursor-pointer">
                  <input type="radio" name="payment_type" value="account" checked={formData.payment_type === 'account'} onChange={() => setFormData({...formData, payment_type: 'account', credit_card_id: ''})} className="mr-2" />
                  Conta Corrente
                </label>
                <label className="flex items-center text-slate-300 text-sm cursor-pointer">
                  <input type="radio" name="payment_type" value="credit_card" checked={formData.payment_type === 'credit_card'} onChange={() => setFormData({...formData, payment_type: 'credit_card', account_id: '', is_paid: false})} className="mr-2" />
                  Cartão de Crédito
                </label>
              </div>
            </div>
          )}

          {/* CAMPOS SE FOR CONTA CORRENTE OU RECEITA */}
          {(formData.payment_type === 'account' || formData.type === 'income') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Conta</label>
              <select value={formData.account_id} onChange={(e) => setFormData({...formData, account_id: e.target.value})} required className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                <option value="">Selecione uma conta...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
          )}

          {/* CAMPOS SE FOR CARTÃO DE CRÉDITO */}
          {formData.type === 'expense' && formData.payment_type === 'credit_card' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Qual Cartão?</label>
                <select value={formData.credit_card_id} onChange={(e) => setFormData({...formData, credit_card_id: e.target.value})} required className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                  <option value="">Selecione...</option>
                  {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Parcelas</label>
                <select value={formData.installments} onChange={(e) => setFormData({...formData, installments: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200">
                  {[...Array(36)].map((_, i) => <option key={i+1} value={i+1}>{i+1}x</option>)}
                </select>
              </div>
            </div>
          )}

          {/* O checkbox "Já foi pago" só faz sentido para Conta Corrente. O Cartão só é pago quando pagamos a fatura toda. */}
          {formData.payment_type === 'account' && (
             <div className="flex items-center gap-2 mt-2">
               <input type="checkbox" id="is_paid" checked={formData.is_paid} onChange={(e) => setFormData({...formData, is_paid: e.target.checked})} className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500" />
               <label htmlFor="is_paid" className="text-sm font-medium text-slate-300">{formData.type === 'income' ? 'Já recebi este valor' : 'Já paguei este valor'}</label>
             </div>
          )}

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6">
            {isEditing ? 'Salvar Alterações' : 'Adicionar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
}