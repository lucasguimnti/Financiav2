'use client';

import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';
import { api } from '../services/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Gera o arquivo CSV Padrão e inicia o download
  const downloadTemplate = () => {
    const headers = "Data;Tipo;Descricao;Valor;Categoria;Origem;Parcelas;Status;Terceiro\n";
    const example = "15/09/2026;Despesa;Supermercado;450,00;Alimentação;Cartão Nubank;1;Pago;\n";
    const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Modelo_Importacao_Lancamentos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors([]);
      setSuccessMsg('');
    }
  };

  const processAndUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target?.result as string;
        // Leitura rústica e veloz de CSV compatível com o Brasil (Separador Ponto e Vírgula)
        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
        
        const transactions = lines.slice(1).map(line => {
          const values = line.split(';');
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i] || ''; });
          return obj;
        });

        const response = await api.post('/api/transactions/bulk', { transactions });
        setSuccessMsg(response.data.message);
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } catch (err: any) {
        if (err.response?.data?.details) {
          setErrors(err.response.data.details);
        } else {
          setErrors([err.response?.data?.error || 'Erro ao processar o arquivo.']);
        }
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="text-purple-400" /> Importação Inteligente
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl flex items-start gap-4">
            <div className="mt-1"><Download className="text-purple-400"/></div>
            <div>
              <h4 className="font-bold text-purple-300 mb-1">Passo 1: Baixe o Modelo Padrão</h4>
              <p className="text-sm text-purple-200/70 mb-3 leading-relaxed">
                Preencha a planilha no Excel sem alterar as colunas de cabeçalho. As categorias que não existirem serão criadas automaticamente para você!
              </p>
              <button onClick={downloadTemplate} className="text-xs font-bold bg-purple-600/30 hover:bg-purple-600 text-purple-200 px-4 py-2 rounded-lg transition-colors border border-purple-500/50">
                Baixar Planilha Modelo (.csv)
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-800/30 rounded-3xl p-10 text-center transition-colors relative group">
            <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <UploadCloud size={48} className={`mx-auto mb-4 ${file ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'}`} />
            {file ? (
              <p className="text-lg font-bold text-emerald-400">{file.name}</p>
            ) : (
              <div>
                <p className="text-lg font-bold text-slate-300 mb-1">Passo 2: Anexe a Planilha Preenchida</p>
                <p className="text-sm text-slate-500">Clique ou arraste o arquivo CSV para cá</p>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
              <h4 className="text-sm font-black text-red-400 flex items-center gap-2 mb-2"><AlertTriangle size={16}/> Corrija os erros no Excel e tente novamente:</h4>
              <ul className="text-xs text-red-300 space-y-1 list-disc list-inside h-24 overflow-y-auto">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle className="text-emerald-400 shrink-0"/>
              <p className="text-emerald-400 font-bold">{successMsg}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
          <button 
            disabled={!file || isLoading} 
            onClick={processAndUpload} 
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black rounded-xl shadow-lg transition-all"
          >
            {isLoading ? 'Processando dados...' : 'Processar e Importar Lançamentos'}
          </button>
        </div>
      </div>
    </div>
  );
}