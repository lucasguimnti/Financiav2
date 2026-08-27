// src/components/CreditCardModal.tsx
import { X, CreditCard } from 'lucide-react';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: { name: string; limit_amount: string; closing_day: string; due_day: string; color: string };
  setCardData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CreditCardModal({ isOpen, onClose, cardData, setCardData, onSubmit }: CreditCardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <CreditCard className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-slate-200">Novo Cartão</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Cartão</label>
            <input 
              type="text" required 
              value={cardData.name}
              onChange={(e) => setCardData({...cardData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
              placeholder="Ex: Nubank, C6 Bank" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Limite do Cartão</label>
            <input 
              type="number" step="0.01" required 
              value={cardData.limit_amount}
              onChange={(e) => setCardData({...cardData, limit_amount: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" 
              placeholder="R$ 0,00" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Dia do Fechamento</label>
              <input 
                type="number" min="1" max="31" required 
                value={cardData.closing_day}
                onChange={(e) => setCardData({...cardData, closing_day: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Ex: 25" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Dia do Vencimento</label>
              <input 
                type="number" min="1" max="31" required 
                value={cardData.due_day}
                onChange={(e) => setCardData({...cardData, due_day: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="Ex: 5" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cor de Identificação</label>
            <input 
              type="color" 
              value={cardData.color}
              onChange={(e) => setCardData({...cardData, color: e.target.value})}
              className="w-full h-12 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 p-1" 
            />
          </div>

          <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6 shadow-lg shadow-purple-500/20">
            Salvar Cartão
          </button>
        </form>
      </div>
    </div>
  );
}