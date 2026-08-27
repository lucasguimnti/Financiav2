// src/components/AccountModal.tsx
import { X } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: { name: string; balance: string };
  setAccountData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing?: boolean; // NOVO: Propriedade para saber se está editando
}

export default function AccountModal({ isOpen, onClose, accountData, setAccountData, onSubmit, isEditing = false }: AccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-200">
            {isEditing ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Instituição</label>
            <input 
              type="text" 
              required 
              value={accountData.name}
              onChange={(e) => setAccountData({...accountData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Ex: Nubank, Itaú, Carteira" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Saldo Atual</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              value={accountData.balance}
              onChange={(e) => setAccountData({...accountData, balance: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="R$ 0,00" 
            />
          </div>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6">
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
}