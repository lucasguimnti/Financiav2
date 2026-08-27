'use client';

import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle, X, Download, Info } from 'lucide-react';
import { api } from '../services/api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: any[];
  accounts?: any[];
  cards?: any[];
  thirdParties?: any[];
}

export default function SmartImportModal({ 
  isOpen, onClose, onSuccess, 
  categories = [], accounts = [], cards = [], thirdParties = [] 
}: SmartImportModalProps) {
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Lancamentos');
    const lists = wb.addWorksheet('ListasOcultas', { state: 'hidden' });

    const catNames = categories.length > 0 ? categories.map(c => c.name) : ['Geral'];
    const accNames = accounts.length > 0 ? accounts.map(a => a.name) : ['Conta Padrão'];
    const cardNames = cards.length > 0 ? cards.map(c => c.name) : ['Sem Cartão'];
    const tpNames = thirdParties.length > 0 ? thirdParties.map(tp => tp.name) : ['Nenhum'];

    lists.getColumn('A').values = ['Categorias', ...catNames];
    lists.getColumn('B').values = ['Contas', ...accNames];
    lists.getColumn('C').values = ['Cartões', ...cardNames];
    lists.getColumn('D').values = ['Terceiros', ...tpNames];

    // SOLUÇÃO UX: DUAS COLUNAS SEPARADAS PARA COMPRA E VENCIMENTO
    ws.columns = [
      { header: 'Data da Compra', key: 'data_compra', width: 20 },
      { header: 'Data Vencimento (Boleto/Conta)', key: 'data_vencimento', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Descrição', key: 'descricao', width: 35 },
      { header: 'Valor (R$)', key: 'valor', width: 15 },
      { header: 'Categoria', key: 'categoria', width: 25 },
      { header: 'Meio de Pagamento', key: 'meio_pagamento', width: 22 },
      { header: 'Origem (Nome)', key: 'origem', width: 25 },
      { header: 'Parcelas', key: 'parcelas', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Terceiro (Reembolso)', key: 'terceiro', width: 25 },
    ];

    const today = new Date().toLocaleDateString('pt-BR');
    
    // Exemplos claros para o usuário entender como preencher cada caso
    ws.addRow({
      data_compra: today, data_vencimento: '10/09/2026', tipo: 'Despesa', descricao: 'Conta de Luz (EXEMPLO)', valor: 150.00,
      categoria: catNames[0], meio_pagamento: 'Conta / Dinheiro', origem: accNames[0],
      parcelas: 1, status: 'Pendente', terceiro: ''
    });
    ws.addRow({
      data_compra: '20/08/2026', data_vencimento: '', tipo: 'Despesa', descricao: 'Compra no Mercado (EXEMPLO)', valor: 350.50,
      categoria: catNames[0], meio_pagamento: 'Cartão de Crédito', origem: cardNames[0],
      parcelas: 1, status: 'Pago', terceiro: ''
    });

    for (let i = 2; i <= 1001; i++) {
      ws.getCell(`C${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Despesa,Receita"'] };
      ws.getCell(`F${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`ListasOcultas!$A$2:$A$${catNames.length + 1}`] };
      ws.getCell(`G${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Conta / Dinheiro,Cartão de Crédito"'] };
      
      // Regra da Origem continua dinâmica baseada no Meio de Pagamento (que agora está na coluna G)
      ws.getCell(`H${i}`).dataValidation = { 
        type: 'list', 
        allowBlank: true, 
        formulae: [`IF($G${i}="Cartão de Crédito",ListasOcultas!$C$2:$C$${cardNames.length + 1},ListasOcultas!$B$2:$B$${accNames.length + 1})`] 
      };
      
      ws.getCell(`J${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Pago,Pendente"'] }; 
      ws.getCell(`K${i}`).dataValidation = { type: 'list', allowBlank: true, formulae: [`ListasOcultas!$D$2:$D$${tpNames.length + 1}`] }; 
    }

    // FORMATAÇÃO CONDICIONAL 1: Se for Cartão, não precisa de Data de Vencimento (fica cinza)
    ws.addConditionalFormatting({
      ref: 'B2:B1001',
      rules: [{
        type: 'expression', formulae: ['$G2="Cartão de Crédito"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEEEEEE' }, fgColor: { argb: 'FFEEEEEE' } }, font: { color: { argb: 'FF94A3B8' } } }
      }]
    });

    // FORMATAÇÃO CONDICIONAL 2: Se for Conta/Dinheiro, não precisa de Parcelas (fica cinza)
    ws.addConditionalFormatting({
      ref: 'I2:I1001',
      rules: [{
        type: 'expression', formulae: ['$G2="Conta / Dinheiro"'],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEEEEEE' }, fgColor: { argb: 'FFEEEEEE' } }, font: { color: { argb: 'FF94A3B8' } } }
      }]
    });

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
    ws.getRow(2).font = { italic: true, color: { argb: 'FF64748B' } };
    ws.getRow(3).font = { italic: true, color: { argb: 'FF64748B' } };

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Template_Inteligente_V3.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]); setErrors([]); setSuccessMsg('');
    }
  };

  const processAndUpload = async () => {
    if (!file) return;
    setIsLoading(true); setErrors([]);

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setErrors(['Formato inválido! Baixe o arquivo Excel (.xlsx) pelo botão acima.']);
      setIsLoading(false); return;
    }

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.getWorksheet('Lancamentos');
      
      if (!ws) throw new Error("Aba 'Lancamentos' não encontrada.");

      const transactions: any[] = [];
      
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        
        const descricao = row.getCell(4).text; // Descrição agora é a coluna 4
        if (!descricao || descricao.includes('(EXEMPLO)')) return;

        const parseDate = (cell: any) => {
          if (!cell || !cell.value) return '';
          if (cell.value instanceof Date) return cell.value.toLocaleDateString('pt-BR');
          return cell.text;
        };

        const dataCompra = parseDate(row.getCell(1));
        const dataVencimento = parseDate(row.getCell(2));
        const meioPagamento = row.getCell(7).text;

        // A INTELIGÊNCIA FINANCEIRA ESTÁ AQUI:
        // Se for Boleto/Conta, o que manda no fluxo de caixa é a Data do Vencimento.
        // Se for Cartão de Crédito, mandamos a Data da Compra e o sistema/fatura se vira.
        let dataFinalParaOBackend = dataCompra;
        if (meioPagamento === 'Conta / Dinheiro' && dataVencimento) {
          dataFinalParaOBackend = dataVencimento;
        }

        transactions.push({
          data: dataFinalParaOBackend, // Esta é a data que o backend efetivamente vai usar
          data_compra_original: dataCompra, // Enviamos extra caso o backend queira registrar
          data_vencimento_original: dataVencimento, // Enviamos extra caso o backend queira registrar
          tipo: row.getCell(3).text,
          descricao: descricao,
          valor: row.getCell(5).value?.toString() || '',
          categoria: row.getCell(6).text,
          meio_pagamento: meioPagamento,
          origem: row.getCell(8).text,
          parcelas: row.getCell(9).value?.toString() || '1',
          status: row.getCell(10).text,
          terceiro: row.getCell(11).text,
        });
      });

      if (transactions.length === 0) throw new Error("Nenhum lançamento válido encontrado. Preencha abaixo das linhas de exemplo.");

      const response = await api.post('/api/transactions/bulk', { transactions });
      setSuccessMsg(response.data.message);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
      
    } catch (err: any) {
      if (err.response?.data?.details) {
        setErrors(err.response.data.details);
      } else {
        setErrors([err.message || err.response?.data?.error || 'Erro ao processar o arquivo.']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-xl font-black text-white flex items-center gap-2"><FileSpreadsheet className="text-purple-400" /> Importação Dinâmica</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl flex items-start gap-4">
            <div className="mt-1"><Download className="text-purple-400"/></div>
            <div>
              <h4 className="font-bold text-purple-300 mb-1">Passo 1: Baixe a Planilha</h4>
              <p className="text-sm text-purple-200/70 mb-4 leading-relaxed">Baixe o template abaixo. Ele já contém os seus cartões, contas e categorias em listas suspensas (dropdowns).</p>
              
              <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl mb-4">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2"><Info size={14} className="text-blue-400"/> Como preencher as Datas?</h5>
                <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                  <li><strong className="text-slate-200">Contas fixas / Boletos:</strong> Preencha a data da Compra e a data de <span className="text-amber-400 font-bold">Vencimento</span>.</li>
                  <li><strong className="text-slate-200">Cartão de Crédito:</strong> Basta a data da Compra. O sistema calcula a fatura pra você.</li>
                </ul>
              </div>

              <button onClick={downloadTemplate} className="w-full text-sm font-bold bg-purple-600/30 hover:bg-purple-600 text-purple-200 px-4 py-3 rounded-xl transition-colors border border-purple-500/50 flex items-center justify-center gap-2 shadow-lg">
                <FileSpreadsheet size={18} /> Baixar Planilha Modelo (.xlsx)
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-800/30 rounded-3xl p-10 text-center transition-colors relative group cursor-pointer">
            <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <UploadCloud size={48} className={`mx-auto mb-4 ${file ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'}`} />
            {file ? (
              <p className="text-lg font-bold text-emerald-400">{file.name}</p>
            ) : (
              <div>
                <p className="text-lg font-bold text-slate-300 mb-1">Passo 2: Anexe a Planilha Preenchida</p>
                <p className="text-sm text-slate-500">Clique ou arraste o arquivo EXCEL para cá</p>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
              <h4 className="text-sm font-black text-red-400 flex items-center gap-2 mb-2"><AlertTriangle size={16}/> Atenção. Encontramos pendências:</h4>
              <ul className="text-xs text-red-300 space-y-1 list-disc list-inside max-h-24 overflow-y-auto custom-scrollbar">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle className="text-emerald-400 shrink-0"/><p className="text-emerald-400 font-bold">{successMsg}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
          <button disabled={!file || isLoading} onClick={processAndUpload} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer">
            {isLoading ? 'Lendo Excel...' : 'Processar e Importar Lançamentos'}
          </button>
        </div>
      </div>
    </div>
  );
}