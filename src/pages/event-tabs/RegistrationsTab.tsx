import React, { useEffect, useState, useMemo } from 'react';
import { maskCPF, maskTelefone, validateEmail, validateTelefone, validateCPF } from '../../lib/validators';

const ITEMS_PER_PAGE = 50;
import { listDocuments, createDocument, updateDocument, removeDocument, getDocument } from '../../lib/firebase-utils';
import { Inscricao, Pessoa, Ticket, Pagamento, Evento, PaginaVenda, CampoFormulario } from '../../types';
import { notifOnce } from '../../lib/notifications';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, UserPlus, Search, MoreHorizontal, CheckCircle, Clock, AlertCircle, Trash2, Edit2, ArrowUpAZ, ArrowDownZA, Filter, X, ArrowUp, ArrowDown, Upload, FileDown, AlertTriangle, Check, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { differenceInMonths } from 'date-fns';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Email } from '../../lib/email';

export default function RegistrationsTab({ eventoId, readOnly = false }: { eventoId: string; readOnly?: boolean }) {
  const [registrations, setRegistrations] = useState<(Inscricao & { pessoa?: Pessoa, ticket?: Ticket })[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [qrInscricao, setQrInscricao] = useState<(Inscricao & { pessoa?: Pessoa }) | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importTicketId, setImportTicketId] = useState('');
  const [importStatus, setImportStatus] = useState<'confirmada' | 'pendente'>('confirmada');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [exportFields, setExportFields] = useState<string[]>(['nome', 'email', 'telefone', 'ticket_nome', 'status', 'data_inscricao']);
  const [itemToDelete, setItemToDelete] = useState<{ regId: string, pessoaId?: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paginas, setPaginas] = useState<PaginaVenda[]>([]);
  const [selectedPagina, setSelectedPagina] = useState<PaginaVenda | null>(null);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | boolean>>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    nome: '',
    ticket: '',
    status: '',
    financeiro: '',
    metodo: '',
    celula: ''
  });

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    idade: 0,
    genero: 'masculino' as 'masculino' | 'feminino',
    celula: '',
    ticketId: '',
    status: 'pendente' as const,
    forma_pagamento: 'pix',
    parcelas: 1,
    precisa_ajuda: false
  });

  const fetchData = async () => {
    setLoading(true);
    const [regData, ticketData, peopleData, eventData, paginasData] = await Promise.all([
      listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`),
      listDocuments<Ticket>(`eventos/${eventoId}/tickets`),
      listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
      getDocument<Evento>('eventos', eventoId),
      listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`)
    ]);

    const doacaoIds = new Set(ticketData.filter(t => t.tipo === 'doacao').map(t => t.id));
    const enriched = regData
      .filter(reg => !doacaoIds.has(reg.ticketId))
      .map(reg => ({
        ...reg,
        pessoa: peopleData.find(p => p.id === reg.pessoaId),
        ticket: ticketData.find(t => t.id === reg.ticketId)
      }));

    setRegistrations(enriched);
    setTickets(ticketData);
    setEvento(eventData);
    setPaginas(paginasData);
    setLoading(false);

    if (eventData?.criado_por) {
      const adminId = eventData.criado_por;
      const total = enriched.length;
      const vagas = eventData.vagas_totais || 0;
      const now = new Date().toISOString();

      if (total >= 1) {
        notifOnce(`pi_${eventoId}`, {
          userId: adminId, eventoId,
          tipo: 'primeira_inscricao',
          titulo: 'Parabéns! Primeira inscrição realizada!',
          mensagem: `Seu evento "${eventData.nome}" acaba de receber sua primeira inscrição.`,
          data: now, lida: false, acao_requirida: false,
        }).catch(() => {});
      }

      if (vagas > 0) {
        const pct = total / vagas;
        if (pct >= 0.5) {
          notifOnce(`meta_50_${eventoId}`, {
            userId: adminId, eventoId,
            tipo: 'meta_inscricoes',
            titulo: '50% das vagas preenchidas!',
            mensagem: `"${eventData.nome}" atingiu 50% de ocupação (${total}/${vagas} vagas).`,
            data: now, lida: false, acao_requirida: false,
            dados_acao: { percentual: 50, total, vagas },
          }).catch(() => {});
        }
        if (pct >= 0.75) {
          notifOnce(`meta_75_${eventoId}`, {
            userId: adminId, eventoId,
            tipo: 'meta_inscricoes',
            titulo: '75% das vagas preenchidas!',
            mensagem: `"${eventData.nome}" atingiu 75% de ocupação (${total}/${vagas} vagas).`,
            data: now, lida: false, acao_requirida: false,
            dados_acao: { percentual: 75, total, vagas },
          }).catch(() => {});
        }
        if (pct >= 1.0) {
          notifOnce(`meta_100_${eventoId}`, {
            userId: adminId, eventoId,
            tipo: 'meta_inscricoes',
            titulo: 'Evento lotado! 100% das vagas preenchidas!',
            mensagem: `"${eventData.nome}" está com todas as ${vagas} vagas preenchidas.`,
            data: now, lida: false, acao_requirida: false,
            dados_acao: { percentual: 100, total, vagas },
          }).catch(() => {});
        }
      }
    }
  };

  const getMaxParcelas = () => {
    if (!evento || !evento.config_pagamento || evento.config_pagamento.installmentLogic === 'free') {
      return 12;
    }

    const selectedTicket = tickets.find(t => t.id === formData.ticketId);
    if (!selectedTicket || !selectedTicket.data_limite) return 12;

    const now = new Date();
    const limitDate = new Date(selectedTicket.data_limite);
    
    // Calculate months between now and limit date
    // example: 02/01 to 02/06 => 6 installments
    const months = (limitDate.getFullYear() - now.getFullYear()) * 12 + (limitDate.getMonth() - now.getMonth()) + 1;
    
    return Math.max(1, Math.min(12, months));
  };

  useEffect(() => {
    fetchData();
  }, [eventoId]);

  useEffect(() => {
    const max = getMaxParcelas();
    if (formData.parcelas > max) {
      setFormData(prev => ({ ...prev, parcelas: max }));
    }
  }, [formData.ticketId, formData.forma_pagamento, tickets, evento]);

  // Helper to extract campo value by matching label keywords
  const getDynValue = (key: string): string => {
    if (!selectedPagina) return '';
    const campo = selectedPagina.campos_formulario.find(c =>
      c.label.toLowerCase().includes(key.toLowerCase()) || c.tipo === key
    );
    return campo ? String(dynamicValues[campo.id] || '') : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedTicket = tickets.find(t => t.id === formData.ticketId);
      if (!selectedTicket) {
        toast.error('Selecione um ingresso válido.');
        return;
      }

      if (!selectedPagina) {
        if (!formData.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
        if (!formData.email.trim() || !validateEmail(formData.email)) {
          toast.error('Informe um e-mail válido.'); return;
        }
        if (formData.telefone && !validateTelefone(formData.telefone)) {
          toast.error('Telefone inválido. Use o formato (00) 00000-0000.'); return;
        }
        const cpfDigits = formData.cpf.replace(/\D/g, '');
        if (cpfDigits && !validateCPF(formData.cpf)) {
          toast.error('CPF inválido.'); return;
        }
        if (formData.idade < 0 || formData.idade > 120) {
          toast.error('Informe uma idade válida (0–120).'); return;
        }
      }

      const initialStatus = formData.precisa_ajuda ? 'ajuda_solicitada' : 'pendente';

      if (editingId) {
        const reg = registrations.find(r => r.id === editingId);
        if (!reg) return;

        // Update Person
        if (reg.pessoaId) {
          await updateDocument(`eventos/${eventoId}/pessoas`, reg.pessoaId, {
            nome: formData.nome,
            email: formData.email,
            cpf: formData.cpf,
            telefone: formData.telefone,
            idade: Number(formData.idade),
            genero: formData.genero,
            celula: formData.celula
          });
        }

        // Update Registration
        let newStatus: Inscricao['status'] = reg.status;
        if (formData.precisa_ajuda) {
          newStatus = 'ajuda_solicitada';
        } else {
          // If help was requested and now is NOT, or if it was already something else, recalculate based on payments
          if (reg.valor_pago >= selectedTicket.valor) {
            newStatus = 'pago';
          } else if (reg.valor_pago > 0) {
            newStatus = 'pagamento_iniciado';
          } else {
            newStatus = 'pendente';
          }
        }

        const editUpdate: Record<string, any> = {
          ticketId: formData.ticketId,
          status: newStatus,
          valor_total: selectedTicket.valor,
          forma_pagamento: formData.forma_pagamento,
          precisa_ajuda: formData.precisa_ajuda,
        };
        if (selectedPagina) {
          const respostas: Record<string, string | boolean> = {};
          selectedPagina.campos_formulario.forEach(c => { respostas[c.label] = dynamicValues[c.id] ?? ''; });
          editUpdate.respostas_formulario = respostas;
          const nome = getDynValue('nome') || getDynValue('name') || formData.nome;
          const email = getDynValue('email') || formData.email;
          const telefone = getDynValue('telefone') || formData.telefone;
          editUpdate.nome = nome;
          editUpdate.email = email;
          editUpdate.telefone = telefone;
        }
        await updateDocument(`eventos/${eventoId}/inscricoes`, editingId, editUpdate);

        // Update method for all pending payments
        const pendingPayments = await listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [
          where('inscricaoId', '==', editingId),
          where('status', '==', 'pendente')
        ]);

        for (const pay of pendingPayments) {
          await updateDocument(`eventos/${eventoId}/pagamentos`, pay.id, {
            metodo: formData.forma_pagamento as any
          });
        }

        toast.success('Inscrição atualizada!');
      } else {
        const pessoaId = uuidv4();
        const inscricaoId = uuidv4();

        // Resolve nome/email from dynamic form or fixed form
        const nome = selectedPagina
          ? (getDynValue('nome') || getDynValue('name') || getDynValue('texto'))
          : formData.nome;
        const email = selectedPagina
          ? (getDynValue('email'))
          : formData.email;
        const telefone = selectedPagina
          ? (getDynValue('telefone') || getDynValue('phone'))
          : formData.telefone;

        await createDocument(`eventos/${eventoId}/pessoas`, pessoaId, {
          id: pessoaId,
          nome: nome || formData.nome,
          email: email || formData.email,
          cpf: formData.cpf.replace(/\D/g, ''),
          telefone: telefone || formData.telefone,
          idade: Number(formData.idade),
          genero: formData.genero,
          celula: formData.celula
        });

        await createDocument(`eventos/${eventoId}/inscricoes`, inscricaoId, {
          id: inscricaoId,
          pessoaId,
          eventoId,
          ticketId: formData.ticketId,
          ticket_nome: selectedTicket.nome,
          nome: nome || formData.nome,
          email: email || formData.email,
          telefone: telefone || formData.telefone,
          ...(formData.cpf ? { cpf: formData.cpf.replace(/\D/g, '') } : {}),
          status: initialStatus,
          valor_total: selectedTicket.valor,
          valor_pago: 0,
          forma_pagamento: formData.forma_pagamento,
          precisa_ajuda: formData.precisa_ajuda,
          validada_manual: true,
          data_inscricao: new Date().toISOString(),
          ...(selectedPagina ? {
            paginaVendaId: selectedPagina.id,
            respostas_formulario: Object.fromEntries(
              selectedPagina.campos_formulario.map(c => [c.label, dynamicValues[c.id] ?? ''])
            )
          } : {})
        });

        // Create pending payments for installments
        const remaining = selectedTicket.valor;
        if (remaining > 0 && formData.parcelas > 0) {
          const installmentValue = remaining / formData.parcelas;
          for (let i = 1; i <= formData.parcelas; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i - 1); // First installment can be now
            
            const pagamentoId = uuidv4();
            await createDocument(`eventos/${eventoId}/pagamentos`, pagamentoId, {
              id: pagamentoId,
              inscricaoId,
              eventoId,
              valor: installmentValue,
              status: 'pendente',
              metodo: formData.forma_pagamento as any,
              data_vencimento: dueDate.toISOString().split('T')[0],
              origem: 'manual'
            });
          }
        }

        // E-mail: confirmação de inscrição
        const participanteEmail = email || formData.email;
        const participanteNome = nome || formData.nome;
        if (participanteEmail) {
          Email.confirmacaoInscricao(
            participanteEmail,
            participanteNome,
            evento?.nome || '',
            evento?.data_inicio ? new Date(evento.data_inicio).toLocaleDateString('pt-BR') : '',
            evento?.local || '',
          );
        }
        toast.success('Inscrição manual realizada!');
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setSelectedPagina(null);
      setDynamicValues({});
      fetchData();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar inscrição.');
    }
  };

  const handleEdit = (reg: Inscricao & { pessoa?: Pessoa }) => {
    // Se a inscrição veio de uma página pública, carrega o form dinâmico
    const paginaId = reg.paginaVendaId || reg.pagina_venda_id;
    const pagina = paginaId ? paginas.find(p => p.id === paginaId) : null;
    if (pagina) {
      setSelectedPagina(pagina);
      // Pré-preenche os valores dinâmicos com as respostas salvas
      const respostas = reg.respostas_formulario || {};
      const vals: Record<string, string | boolean> = {};
      pagina.campos_formulario.forEach(c => {
        // tenta por label (chave salva no Firestore) ou por id
        vals[c.id] = respostas[c.label] ?? respostas[c.id] ?? '';
      });
      setDynamicValues(vals);
    } else {
      setSelectedPagina(null);
      setDynamicValues({});
    }
    setFormData({
      nome: reg.pessoa?.nome || reg.nome || '',
      email: reg.pessoa?.email || reg.email || '',
      cpf: reg.pessoa?.cpf || '',
      telefone: reg.pessoa?.telefone || reg.telefone || '',
      idade: reg.pessoa?.idade || 0,
      genero: reg.pessoa?.genero || 'masculino',
      celula: reg.pessoa?.celula || '',
      ticketId: reg.ticketId,
      status: reg.status as any,
      forma_pagamento: reg.forma_pagamento || 'pix',
      parcelas: 1,
      precisa_ajuda: reg.precisa_ajuda || false
    });
    setEditingId(reg.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (regId: string, pessoaId?: string) => {
    setItemToDelete({ regId, pessoaId });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { regId, pessoaId } = itemToDelete;
      
      // Delete associated payments
      const payments = await listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [
        where('inscricaoId', '==', regId)
      ]);
      
      for (const pay of payments) {
        await removeDocument(`eventos/${eventoId}/pagamentos`, pay.id);
      }

      await removeDocument(`eventos/${eventoId}/inscricoes`, regId);
      if (pessoaId) {
        await removeDocument(`eventos/${eventoId}/pessoas`, pessoaId);
      }
      
      toast.success('Inscrição excluída!');
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir inscrição.');
    }
  };


  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      idade: 0,
      genero: 'masculino',
      celula: '',
      ticketId: '',
      status: 'pendente',
      forma_pagamento: 'pix',
      parcelas: 1,
      precisa_ajuda: false
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setImportPreview(results.data);
          toast.success(`${results.data.length} registros encontrados no CSV.`);
        },
        error: (error) => {
          console.error(error);
          toast.error("Erro ao ler o arquivo CSV.");
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportPreview(data);
        toast.success(`${data.length} registros encontrados na planilha Excel.`);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls).");
    }
  };

  const processImport = async () => {
    if (!importTicketId) {
      toast.error("Selecione um lote (ingresso) para as novas inscrições.");
      return;
    }
    if (importPreview.length === 0) {
      toast.error("Nenhum dado para importar.");
      return;
    }

    setImportLoading(true);
    const selectedTicket = tickets.find(t => t.id === importTicketId);
    if (!selectedTicket) return;

    let successCount = 0;
    let errorCount = 0;

    // Process in batches or one by one
    for (const row of importPreview) {
      try {
        const nome = row.nome || row.Nome || row.NOME || '';
        const email = row.email || row.Email || row.EMAIL || row.E_mail || '';
        
        if (!nome || !email) {
          errorCount++;
          continue;
        }

        const pessoaId = uuidv4();
        const inscricaoId = uuidv4();

        // Create Person
        await createDocument(`eventos/${eventoId}/pessoas`, pessoaId, {
          id: pessoaId,
          nome: nome,
          email: email,
          cpf: row.cpf || row.CPF || '',
          telefone: row.telefone || row.Telefone || row.whatsapp || row.WhatsApp || '',
          idade: Number(row.idade || row.Idade || 0),
          genero: (row.genero || row.Gênero || 'masculino').toLowerCase().includes('fem') ? 'feminino' : 'masculino',
          celula: row.celula || row.Célula || row.Celula || ''
        });

        // Create Registration
        await createDocument(`eventos/${eventoId}/inscricoes`, inscricaoId, {
          id: inscricaoId,
          pessoaId,
          eventoId,
          ticketId: importTicketId,
          status: importStatus === 'confirmada' ? 'pago' : 'pendente',
          valor_total: selectedTicket.valor,
          valor_pago: importStatus === 'confirmada' ? selectedTicket.valor : 0,
          forma_pagamento: 'importacao',
          precisa_ajuda: false,
          validada_manual: true,
          data_inscricao: new Date().toISOString()
        });

        successCount++;
      } catch (err) {
        console.error("Import row error:", err);
        errorCount++;
      }
    }

    setImportLoading(false);
    setIsImportDialogOpen(false);
    setImportPreview([]);
    setImportTicketId('');
    fetchData();
    
    if (errorCount > 0) {
      toast.info(`Importação concluída: ${successCount} sucessos, ${errorCount} erros.`);
    } else {
      toast.success(`${successCount} inscrições importadas com sucesso!`);
    }
  };

  const EXPORT_FIELD_OPTIONS: { key: string; label: string }[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'ticket_nome', label: 'Ingresso' },
    { key: 'status', label: 'Status' },
    { key: 'data_inscricao', label: 'Data de Inscrição' },
    { key: 'forma_pagamento', label: 'Forma de Pagamento' },
    { key: 'valor_total', label: 'Valor' },
    { key: 'respostas_formulario', label: 'Respostas do Formulário' },
  ];

  const handleExport = () => {
    const rows = filteredRegistrations.map(r => {
      const row: Record<string, any> = {};
      if (exportFields.includes('nome')) row['Nome'] = r.pessoa?.nome || r.nome || '';
      if (exportFields.includes('email')) row['E-mail'] = r.pessoa?.email || r.email || '';
      if (exportFields.includes('telefone')) row['Telefone'] = r.pessoa?.telefone || r.telefone || '';
      if (exportFields.includes('ticket_nome')) row['Ingresso'] = r.ticket?.nome || r.ticket_nome || '';
      if (exportFields.includes('status')) row['Status'] = r.status || '';
      if (exportFields.includes('data_inscricao')) row['Data de Inscrição'] = r.data_inscricao ? new Date(r.data_inscricao).toLocaleDateString('pt-BR') : '';
      if (exportFields.includes('forma_pagamento')) row['Forma de Pagamento'] = r.forma_pagamento || '';
      if (exportFields.includes('valor_total')) row['Valor'] = r.valor_total != null ? `R$ ${r.valor_total.toFixed(2)}` : '';
      if (exportFields.includes('respostas_formulario') && r.respostas_formulario) {
        Object.entries(r.respostas_formulario).forEach(([k, v]) => { row[k] = String(v); });
      }
      return row;
    });

    if (exportFormat === 'csv') {
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tovia_inscricoes.csv'; a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inscrições');
      XLSX.writeFile(wb, 'tovia_inscricoes.xlsx');
    } else if (exportFormat === 'pdf') {
      const printWin = window.open('', '_blank');
      if (!printWin) return;
      const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
      const tableRows = rows.map(r => `<tr>${cols.map(c => `<td style="border:1px solid #ddd;padding:6px 10px;font-size:12px">${r[c] ?? ''}</td>`).join('')}</tr>`).join('');
      printWin.document.write(`<html><head><title>Inscrições</title></head><body style="font-family:sans-serif;padding:20px"><h2 style="margin-bottom:16px">Inscrições</h2><table style="border-collapse:collapse;width:100%"><thead><tr>${cols.map(c => `<th style="border:1px solid #ddd;padding:6px 10px;background:#f0f7f3;text-align:left;font-size:12px">${c}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`);
      printWin.document.close();
      printWin.print();
    }
    toast.success(`${rows.length} inscrições exportadas!`);
  };

  const downloadTemplate = () => {
    const headers = [["Nome", "Email", "Telefone", "CPF", "Idade", "Gênero", "Célula"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "tovia_template_inscricoes.xlsx");
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = searchTerm === '' || 
      r.pessoa?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pessoa?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNome = columnFilters.nome === '' || 
      r.pessoa?.nome.toLowerCase().includes(columnFilters.nome.toLowerCase());
    
    const matchesTicket = columnFilters.ticket === '' || 
      r.ticket?.nome.toLowerCase().includes(columnFilters.ticket.toLowerCase());
    
    const matchesStatus = columnFilters.status === '' || 
      r.status.toLowerCase().includes(columnFilters.status.toLowerCase());
    
    const matchesMetodo = columnFilters.metodo === '' || 
      (r.forma_pagamento || 'PIX').toLowerCase().includes(columnFilters.metodo.toLowerCase());
    
    const matchesCelula = columnFilters.celula === '' || 
      (r.pessoa?.celula || '').toLowerCase().includes(columnFilters.celula.toLowerCase());

    const matchesFinanceiro = columnFilters.financeiro === '' || 
      (r.valor_pago || 0).toString().includes(columnFilters.financeiro);

    return matchesSearch && matchesNome && matchesTicket && matchesStatus && matchesMetodo && matchesCelula && matchesFinanceiro;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal: any = '';
    let bVal: any = '';

    switch (sortConfig.key) {
      case 'nome':
        aVal = a.pessoa?.nome || '';
        bVal = b.pessoa?.nome || '';
        break;
      case 'ticket':
        aVal = a.ticket?.nome || '';
        bVal = b.ticket?.nome || '';
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      case 'financeiro':
        aVal = a.valor_pago || 0;
        bVal = b.valor_pago || 0;
        break;
      case 'metodo':
        aVal = a.forma_pagamento || 'PIX';
        bVal = b.forma_pagamento || 'PIX';
        break;
      case 'celula':
        aVal = a.pessoa?.celula || '';
        bVal = b.pessoa?.celula || '';
        break;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => { setCurrentPage(0); }, [searchTerm, columnFilters, sortConfig]);

  const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
  const paginatedRegistrations = filteredRegistrations.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpAZ className="w-3 h-3 ml-2 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-2 text-primary" /> 
      : <ArrowDown className="w-3 h-3 ml-2 text-primary" />;
  };

  const FilterHeader = ({ 
    label, 
    filterKey, 
    columnKey 
  }: { 
    label: string, 
    filterKey: string, 
    columnKey: string 
  }) => (
    <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 group">
      <div className="flex items-center">
        <button 
          onClick={() => requestSort(columnKey)}
          className="flex items-center hover:text-primary transition-colors focus:outline-none"
        >
          {label}
          <SortIcon columnKey={columnKey} />
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 transition-all rounded-md ${columnFilters[filterKey] ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
              <Filter className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar {label}</p>
                {columnFilters[filterKey] && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 text-destructive"
                    onClick={() => setColumnFilters(prev => ({ ...prev, [filterKey]: '' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Input 
                placeholder={`Filtrar por ${label}...`}
                value={columnFilters[filterKey]}
                onChange={e => setColumnFilters(prev => ({ ...prev, [filterKey]: e.target.value }))}
                className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TableHead>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black uppercase text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'pagamento_iniciado': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black uppercase text-[10px]"><Clock className="w-3 h-3 mr-1" /> Pagamento Iniciado</Badge>;
      case 'pendente': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black uppercase text-[10px]"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'ajuda_solicitada': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-black uppercase text-[10px]"><AlertCircle className="w-3 h-3 mr-1" /> Ajuda Solicitada</Badge>;
      case 'analise': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-black uppercase text-[10px]"><AlertCircle className="w-3 h-3 mr-1" /> Em Análise</Badge>;
      default: return <Badge variant="outline" className="font-black uppercase text-[10px] tracking-widest">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="tab-page-header">
        <div><h2>Participantes</h2><p>Lista de inscrições e controle de presença.</p></div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            className="pl-11 rounded-2xl border-none bg-card h-12 font-bold shadow-sm focus-visible:ring-primary transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {!readOnly && (
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/5 gap-2 rounded-2xl h-12 px-6 font-black transition-all active:scale-95 flex-1 md:flex-none"
            >
              <Upload className="w-5 h-5 shrink-0" />
              Importar / Exportar
            </Button>
            <Button
              onClick={() => {
                const paginasComFormulario = paginas.filter(p => p.campos_formulario.length > 0);
                if (paginasComFormulario.length === 0) {
                  toast.error('Crie uma página de vendas com formulário antes de realizar inscrições manuais.');
                  return;
                }
                resetForm();
                setEditingId(null);
                setSelectedPagina(null);
                setDynamicValues({});
                setShowPageSelector(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20 transition-all active:scale-95 flex-1 md:flex-none"
            >
              <UserPlus className="w-5 h-5 shrink-0" />
              Inscrição Manual
            </Button>
          </div>
        )}

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-4xl rounded-[2.5rem] border-none shadow-2xl p-0 bg-card transition-colors max-h-[90vh] overflow-hidden">
            <div className="flex h-full max-h-[90vh]">
              {/* ── LEFT: Import ── */}
              <div className="flex-1 p-8 overflow-y-auto scrollbar-hide border-r border-border/50">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Upload className="w-6 h-6 shrink-0" />
                </div>
                Importar
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Lote para as inscrições</Label>
                  <Select value={importTicketId} onValueChange={setImportTicketId}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold focus:ring-primary">
                      <SelectValue placeholder="Selecione o Lote" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {tickets.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-medium">
                          {t.nome} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Status Padrão</Label>
                  <Select value={importStatus} onValueChange={v => setImportStatus(v as any)}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="confirmada" className="font-medium">Confirmada (Pago)</SelectItem>
                      <SelectItem value="pendente" className="font-medium">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div 
                className="border-2 border-dashed border-border/50 rounded-[2rem] p-10 text-center space-y-4 hover:bg-muted/10 transition-all group relative cursor-pointer"
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <input 
                  id="import-file"
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {importPreview.length > 0 ? (
                    <Check className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-black text-lg text-foreground">
                    {importPreview.length > 0 ? `${importPreview.length} registros prontos` : 'Arraste ou selecione seu arquivo'}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">CSV ou Excel (.xlsx, .xls)</p>
                </div>
                {importPreview.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full text-[10px] font-black uppercase mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImportPreview([]);
                    }}
                  >
                    <X className="w-3 h-3 mr-1" /> Remover Arquivo
                  </Button>
                )}
              </div>

              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-amber-900 font-black text-sm uppercase tracking-wide">Importante</p>
                  <p className="text-amber-800/80 text-xs font-medium leading-relaxed">
                    Os nomes e emails são obrigatórios. O sistema tentará mapear as colunas automaticamente.
                  </p>
                  <button 
                    onClick={downloadTemplate}
                    className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-1 mt-2 hover:underline"
                  >
                    <FileDown className="w-3 h-3" /> Baixar Planilha Exemplo
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 gap-3 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => setIsImportDialogOpen(false)}
                className="rounded-2xl h-12 px-8 font-black text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                disabled={importLoading || importPreview.length === 0 || !importTicketId}
                onClick={processImport}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {importLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </div>
                ) : (
                  `Importar ${importPreview.length} registros`
                )}
              </Button>
            </DialogFooter>
              </div>{/* end left */}

              {/* ── RIGHT: Export ── */}
              <div className="flex-1 p-8 overflow-y-auto scrollbar-hide flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-primary">
                    <FileDown className="w-6 h-6 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Exportar</h2>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Formato</p>
                  <div className="flex gap-2">
                    {(['xlsx', 'csv', 'pdf'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setExportFormat(f)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all border ${exportFormat === f ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground border-transparent hover:border-primary/30'}`}
                      >
                        .{f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campos a exportar</p>
                  <div className="space-y-2">
                    {EXPORT_FIELD_OPTIONS.map(opt => (
                      <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={exportFields.includes(opt.key)}
                          onChange={e => setExportFields(prev => e.target.checked ? [...prev, opt.key] : prev.filter(f => f !== opt.key))}
                          className="w-4 h-4 accent-primary rounded"
                        />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl text-xs text-muted-foreground font-medium">
                  {filteredRegistrations.length} inscrição(ões) serão exportadas conforme o filtro atual da tabela.
                </div>

                <div className="mt-auto pt-4">
                  <Button
                    onClick={handleExport}
                    disabled={exportFields.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar {filteredRegistrations.length} inscrições
                  </Button>
                </div>
              </div>{/* end right */}
            </div>{/* end flex */}
          </DialogContent>
        </Dialog>

        {/* Page selector dialog */}
        <Dialog open={showPageSelector} onOpenChange={setShowPageSelector}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <UserPlus className="w-6 h-6 shrink-0" />
                </div>
                Inscrição Manual
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-medium pt-1">Selecione a página de vendas cujo formulário deseja preencher.</p>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              {paginas.filter(p => p.campos_formulario.length > 0).map(p => {
                const paginaTickets = tickets.filter(t => p.ticketIds.includes(t.id));
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPagina(p);
                      // Pre-set ticketId if page has only one ticket
                      if (paginaTickets.length === 1) {
                        setFormData(prev => ({ ...prev, ticketId: paginaTickets[0].id }));
                      } else {
                        setFormData(prev => ({ ...prev, ticketId: '' }));
                      }
                      setDynamicValues({});
                      setShowPageSelector(false);
                      setIsDialogOpen(true);
                    }}
                    className="w-full text-left p-5 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <p className="font-black text-foreground group-hover:text-primary transition-colors">{p.nome}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {p.campos_formulario.length} campo(s) · {paginaTickets.length} ingresso(s) vinculado(s)
                    </p>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setSelectedPagina(null);
            setDynamicValues({});
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <UserPlus className="w-6 h-6 shrink-0" />
                </div>
                {editingId ? 'Editar Inscrição' : 'Inscrição Manual'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">

              {/* Dynamic fields from sales page form */}
              {selectedPagina ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{selectedPagina.nome}</p>
                    <button type="button" onClick={() => { setIsDialogOpen(false); setShowPageSelector(true); }} className="text-[9px] text-muted-foreground hover:text-foreground underline ml-auto">Trocar página</button>
                  </div>
                  {selectedPagina.campos_formulario.map((campo: CampoFormulario) => (
                    <div key={campo.id} className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                        {campo.label}{campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {campo.tipo === 'select' ? (
                        <Select
                          value={String(dynamicValues[campo.id] || '')}
                          onValueChange={v => setDynamicValues(prev => ({ ...prev, [campo.id]: v }))}
                        >
                          <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                            <SelectValue placeholder={campo.placeholder || 'Selecione...'} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {(campo.opcoes || []).map(op => (
                              <SelectItem key={op} value={op} className="font-medium">{op}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : campo.tipo === 'checkbox' ? (
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                          <input
                            type="checkbox"
                            checked={Boolean(dynamicValues[campo.id])}
                            onChange={e => setDynamicValues(prev => ({ ...prev, [campo.id]: e.target.checked }))}
                            className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-foreground">{campo.label}</span>
                        </div>
                      ) : campo.tipo === 'textarea' ? (
                        <textarea
                          required={campo.obrigatorio}
                          placeholder={campo.placeholder}
                          value={String(dynamicValues[campo.id] || '')}
                          onChange={e => setDynamicValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                          className="w-full rounded-xl border-none bg-muted/50 p-3 font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none min-h-[80px] text-sm"
                        />
                      ) : (
                        <Input
                          type={campo.tipo === 'email' ? 'email' : campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
                          required={campo.obrigatorio}
                          placeholder={campo.placeholder}
                          value={String(dynamicValues[campo.id] || '')}
                          onChange={e => setDynamicValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                          className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  {/* Ingresso select — filtered to page's ticketIds */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Ingresso</Label>
                    <Select value={formData.ticketId} onValueChange={v => setFormData(prev => ({ ...prev, ticketId: v }))}>
                      <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                        <SelectValue placeholder="Selecione um ingresso">
                          {formData.ticketId ? tickets.find(t => t.id === formData.ticketId)?.nome : 'Selecione um ingresso'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl text-foreground">
                        {tickets.filter(t => selectedPagina.ticketIds.includes(t.id)).map(t => (
                          <SelectItem key={t.id} value={t.id} className="font-medium">
                            {t.nome} — {t.tipo === 'gratuito' || t.tipo === 'doacao' ? 'Gratuito' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                /* Original fixed fields for edit mode */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Nome Completo</Label>
                      <Input id="nome" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Email</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">CPF</Label>
                      <Input id="cpf" placeholder="000.000.000-00" maxLength={14} value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Telefone</Label>
                      <Input id="telefone" placeholder="(00) 00000-0000" maxLength={15} value={formData.telefone} onChange={e => setFormData({...formData, telefone: maskTelefone(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idade" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Idade</Label>
                      <Input id="idade" type="number" value={formData.idade} onChange={e => setFormData({...formData, idade: Number(e.target.value)})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Gênero</Label>
                      <Select value={formData.genero} onValueChange={v => setFormData({...formData, genero: v as any})}>
                        <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm focus:ring-primary">
                          <SelectValue>
                            {formData.genero === 'masculino' ? 'Masculino' : 'Feminino'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="masculino" className="font-medium">Masculino</SelectItem>
                          <SelectItem value="feminino" className="font-medium">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="celula" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Célula</Label>
                      <Input id="celula" value={formData.celula} onChange={e => setFormData({...formData, celula: e.target.value})} className="rounded-xl border-none bg-muted/50 h-12 font-bold focus-visible:ring-primary transition-colors" />
                    </div>
                  </div>
                </>
              )}


              <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between">
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-foreground">Solicitou Ajuda?</Label>
                  <p className="text-[10px] text-muted-foreground font-medium">Define o status como "Ajuda Solicitada"</p>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.precisa_ajuda}
                  onChange={e => setFormData({...formData, precisa_ajuda: e.target.checked})}
                  className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-4">
                {editingId ? 'Salvar Alterações' : 'Finalizar Inscrição'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8 bg-card transition-colors">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-destructive tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
                  <Trash2 className="w-6 h-6 shrink-0" />
                </div>
                Excluir Inscrição
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                Tem certeza que deseja excluir esta inscrição? Esta ação <span className="text-destructive font-black underline">não pode ser desfeita</span> e todos os pagamentos vinculados serão removidos.
              </p>
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-2xl h-12 px-8 font-black text-muted-foreground hover:bg-muted">Cancelar</Button>
              <Button onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl h-12 px-10 font-black shadow-xl shadow-destructive/20 active:scale-95 transition-all">Excluir Inscrição</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-card transition-colors border border-border/50">
        <div>
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/50 border-b border-border/50 hover:bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 px-4 w-[28%] group">
                  <div className="flex items-center">
                    <button 
                      onClick={() => requestSort('nome')}
                      className="flex items-center hover:text-primary transition-colors focus:outline-none"
                    >
                      Nome / Contato
                      <SortIcon columnKey="nome" />
                    </button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-6 w-6 ml-1 transition-all rounded-md ${columnFilters.nome ? 'text-primary bg-primary/10' : 'opacity-20 group-hover:opacity-100'}`}>
                          <Filter className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 rounded-xl border-none shadow-2xl bg-card">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filtrar Nome</p>
                            {columnFilters.nome && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 text-destructive"
                                onClick={() => setColumnFilters(prev => ({ ...prev, nome: '' }))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <Input 
                            placeholder="Filtrar por nome..."
                            value={columnFilters.nome}
                            onChange={e => setColumnFilters(prev => ({ ...prev, nome: e.target.value }))}
                            className="h-9 rounded-lg border-none bg-muted font-bold text-xs focus-visible:ring-primary"
                            autoFocus
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <FilterHeader label="Lote / Ingresso" filterKey="ticket" columnKey="ticket" />
                <FilterHeader label="Status" filterKey="status" columnKey="status" />
                <FilterHeader label="Financeiro" filterKey="financeiro" columnKey="financeiro" />
                <FilterHeader label="Método" filterKey="metodo" columnKey="metodo" />
                <TableHead className="font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 w-[10%]">Resp.</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-widest text-muted-foreground h-14 px-3 w-[12%]">Gerenciar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Carregando dados...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                    Nenhuma inscrição encontrada na lista.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRegistrations.map(reg => (
                  <TableRow key={reg.id} className="hover:bg-muted/30 transition-colors border-b border-border/10 group">
                    <TableCell className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground tracking-tight">{reg.pessoa?.nome}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{reg.pessoa?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black text-[9px] uppercase border-primary/20 bg-primary/5 text-primary py-1 px-3 rounded-lg">{reg.ticket?.nome}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(reg.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary tracking-tight">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_pago || 0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                          Total {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_total)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest bg-muted/50 py-1 px-2 rounded-md">{reg.forma_pagamento || 'PIX'}</span>
                    </TableCell>
                    <TableCell>
                      {reg.respostas_formulario && Object.keys(reg.respostas_formulario).length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10">
                              {Object.keys(reg.respostas_formulario).length} resp.
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4 rounded-2xl border-none shadow-2xl bg-card" align="start">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Respostas do formulário</p>
                            <div className="space-y-2">
                              {Object.entries(reg.respostas_formulario).map(([label, valor]) => (
                                <div key={label}>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                  <p className="text-sm font-bold text-foreground">{String(valor) || '-'}</p>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-3">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        {reg.status === 'pago' && (
                          <Button variant="ghost" size="icon" onClick={() => setQrInscricao(reg)} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Ver QR Code">
                            <QrCode className="w-4 h-4" />
                          </Button>
                        )}
                        {!readOnly && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(reg)} className="h-10 w-10 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Editar inscrição">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(reg.id, reg.pessoaId)} className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" title="Excluir inscrição">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              {currentPage * ITEMS_PER_PAGE + 1}–{Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredRegistrations.length)} de {filteredRegistrations.length} inscritos
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs rounded-lg"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ← Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i).filter(i =>
                i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1
              ).reduce<(number | '...')[]>((acc, i, idx, arr) => {
                if (idx > 0 && (i as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(i);
                return acc;
              }, []).map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <Button
                    key={item}
                    variant={currentPage === item ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-8 w-8 p-0 text-xs rounded-lg ${currentPage === item ? 'bg-primary text-white' : ''}`}
                    onClick={() => setCurrentPage(item as number)}
                  >
                    {(item as number) + 1}
                  </Button>
                )
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs rounded-lg"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Próximo →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!qrInscricao} onOpenChange={o => { if (!o) setQrInscricao(null); }}>
        <DialogContent className="sm:max-w-xs rounded-[2rem] border-none shadow-2xl p-0 bg-card overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-base font-black">QR Code do Ingresso</DialogTitle>
          </DialogHeader>
          {qrInscricao && (
            <div className="flex flex-col items-center gap-4 px-6 pb-6">
              <div className="bg-white p-4 rounded-2xl shadow-inner">
                <QRCodeSVG value={qrInscricao.id} size={180} level="M" />
              </div>
              <div className="text-center">
                <p className="font-black text-foreground">{qrInscricao.pessoa?.nome || qrInscricao.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{qrInscricao.ticket?.nome || qrInscricao.ticket_nome}</p>
                {qrInscricao.presenca && (
                  <span className="mt-2 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Presença confirmada
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
