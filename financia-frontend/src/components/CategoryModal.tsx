// src/components/CategoryModal.tsx
import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryData: { name: string; type: string; color: string };
  setCategoryData: (data: { name: string; type: string; color: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CategoryModal({ isOpen, onClose, categoryData, setCategoryData, onSubmit }: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-200">Nova Categoria</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Categoria</label>
            <input type="text" required value={categoryData.name} onChange={(e) => setCategoryData({...categoryData, name: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Alimentação, Lazer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setCategoryData({...categoryData, type: 'income'})} className={`py-3 px-4 rounded-lg font-medium transition-colors border ${categoryData.type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>Receita</button>
              <button type="button" onClick={() => setCategoryData({...categoryData, type: 'expense'})} className={`py-3 px-4 rounded-lg font-medium transition-colors border ${categoryData.type === 'expense' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>Despesa</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Cor de Identificação</label>
            <input type="color" required value={categoryData.color} onChange={(e) => setCategoryData({...categoryData, color: e.target.value})} className="w-full h-12 p-1 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer" />
          </div>
          <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6">
            Criar Categoria
          </button>
        </form>
      </div>
    </div>
  );
}