import { useEffect, useState } from 'react';
import { maskCPF, maskTelefone, validateEmail, validateTelefone, validateCPF } from '~/utils/validators';
import { listDocuments, createDocument, updateDocument, removeDocument, getDocument } from '~/services/firestore';
import { Inscricao, Pessoa, Ticket, Pagamento, Evento, PaginaVenda } from '~/types';
import { notifOnce } from '~/utils/notifications';
import { where, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Email, interpolate } from '~/services/email';

const ITEMS_PER_PAGE = 50;

const EXPORT_FIELD_OPTIONS = [
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

function emptyForm() {
  return {
    nome: '', email: '', cpf: '', telefone: '',
    idade: 0, genero: 'masculino' as 'masculino' | 'feminino',
    celula: '', ticketId: '', status: 'pendente' as const,
    forma_pagamento: 'pix', parcelas: 1, precisa_ajuda: false,
  };
}

export function useRegistrations(eventoId: string) {
  const [registrations, setRegistrations] = useState<(Inscricao & { pessoa?: Pessoa; ticket?: Ticket })[]>([]);
  const [tickets, setTickets]             = useState<Ticket[]>([]);
  const [evento, setEvento]               = useState<Evento | null>(null);
  const [loading, setLoading]             = useState(true);
  const [paginas, setPaginas]             = useState<PaginaVenda[]>([]);

  const [isDialogOpen, setIsDialogOpen]           = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [qrInscricao, setQrInscricao]             = useState<(Inscricao & { pessoa?: Pessoa }) | null>(null);

  const [importLoading, setImportLoading]   = useState(false);
  const [importPreview, setImportPreview]   = useState<any[]>([]);
  const [importTicketId, setImportTicketId] = useState('');
  const [importStatus, setImportStatus]     = useState<'confirmada' | 'pendente'>('confirmada');

  const [exportFormat, setExportFormat]   = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [exportFields, setExportFields]   = useState<string[]>(['nome', 'email', 'telefone', 'ticket_nome', 'status', 'data_inscricao']);

  const [itemToDelete, setItemToDelete] = useState<{ regId: string; pessoaId?: string } | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [editingId, setEditingId]       = useState<string | null>(null);

  const [selectedPagina, setSelectedPagina]   = useState<PaginaVenda | null>(null);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [dynamicValues, setDynamicValues]     = useState<Record<string, string | boolean>>({});

  const [currentPage, setCurrentPage] = useState(0);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    nome: '', ticket: '', status: '', financeiro: '', metodo: '', celula: '',
  });

  const [formData, setFormData] = useState(emptyForm());

  const fetchData = async () => {
    setLoading(true);
    const [regData, ticketData, peopleData, eventData, paginasData] = await Promise.all([
      listDocuments<Inscricao>(`eventos/${eventoId}/inscricoes`, [limit(500)]),
      listDocuments<Ticket>(`eventos/${eventoId}/tickets`),
      listDocuments<Pessoa>(`eventos/${eventoId}/pessoas`),
      getDocument<Evento>('eventos', eventoId),
      listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`),
    ]);

    const doacaoIds = new Set(ticketData.filter(t => t.tipo === 'doacao').map(t => t.id));
    const enriched = regData
      .filter(reg => !doacaoIds.has(reg.ticketId))
      .map(reg => ({
        ...reg,
        pessoa: peopleData.find(p => p.id === reg.pessoaId),
        ticket: ticketData.find(t => t.id === reg.ticketId),
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
          userId: adminId, eventoId, tipo: 'primeira_inscricao',
          titulo: 'Parabéns! Primeira inscrição realizada!',
          mensagem: `Seu evento "${eventData.nome}" acaba de receber sua primeira inscrição.`,
          data: now, lida: false, acao_requirida: false,
        }).catch(() => {});
      }
      if (vagas > 0) {
        const pct = total / vagas;
        if (pct >= 0.5) notifOnce(`meta_50_${eventoId}`, { userId: adminId, eventoId, tipo: 'meta_inscricoes', titulo: '50% das vagas preenchidas!', mensagem: `"${eventData.nome}" atingiu 50% de ocupação (${total}/${vagas} vagas).`, data: now, lida: false, acao_requirida: false, dados_acao: { percentual: 50, total, vagas } }).catch(() => {});
        if (pct >= 0.75) notifOnce(`meta_75_${eventoId}`, { userId: adminId, eventoId, tipo: 'meta_inscricoes', titulo: '75% das vagas preenchidas!', mensagem: `"${eventData.nome}" atingiu 75% de ocupação (${total}/${vagas} vagas).`, data: now, lida: false, acao_requirida: false, dados_acao: { percentual: 75, total, vagas } }).catch(() => {});
        if (pct >= 1.0) notifOnce(`meta_100_${eventoId}`, { userId: adminId, eventoId, tipo: 'meta_inscricoes', titulo: 'Evento lotado! 100% das vagas preenchidas!', mensagem: `"${eventData.nome}" está com todas as ${vagas} vagas preenchidas.`, data: now, lida: false, acao_requirida: false, dados_acao: { percentual: 100, total, vagas } }).catch(() => {});
      }
    }
  };

  const getMaxParcelas = () => {
    if (!evento || !evento.config_pagamento || evento.config_pagamento.installmentLogic === 'free') return 12;
    const selectedTicket = tickets.find(t => t.id === formData.ticketId);
    if (!selectedTicket || !selectedTicket.data_limite) return 12;
    const now = new Date();
    const limitDate = new Date(selectedTicket.data_limite);
    const months = (limitDate.getFullYear() - now.getFullYear()) * 12 + (limitDate.getMonth() - now.getMonth()) + 1;
    return Math.max(1, Math.min(12, months));
  };

  useEffect(() => { fetchData(); }, [eventoId]);

  useEffect(() => {
    const max = getMaxParcelas();
    if (formData.parcelas > max) setFormData(prev => ({ ...prev, parcelas: max }));
  }, [formData.ticketId, formData.forma_pagamento, tickets, evento]);

  useEffect(() => { setCurrentPage(0); }, [searchTerm, columnFilters, sortConfig]);

  const getDynValue = (key: string): string => {
    if (!selectedPagina) return '';
    const campo = selectedPagina.campos_formulario.find(c =>
      c.label.toLowerCase().includes(key.toLowerCase()) || c.tipo === key
    );
    return campo ? String(dynamicValues[campo.id] || '') : '';
  };

  const resetForm = () => setFormData(emptyForm());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedTicket = tickets.find(t => t.id === formData.ticketId);
      if (!selectedTicket) { toast.error('Selecione um ingresso válido.'); return; }

      if (!selectedPagina) {
        if (!formData.nome.trim()) { toast.error('Nome é obrigatório.'); return; }
        if (!formData.email.trim() || !validateEmail(formData.email)) { toast.error('Informe um e-mail válido.'); return; }
        if (formData.telefone && !validateTelefone(formData.telefone)) { toast.error('Telefone inválido. Use o formato (00) 00000-0000.'); return; }
        const cpfDigits = formData.cpf.replace(/\D/g, '');
        if (cpfDigits && !validateCPF(formData.cpf)) { toast.error('CPF inválido.'); return; }
        if (formData.idade < 0 || formData.idade > 120) { toast.error('Informe uma idade válida (0–120).'); return; }
      }

      const initialStatus = formData.precisa_ajuda ? 'ajuda_solicitada' : 'pendente';

      if (editingId) {
        const reg = registrations.find(r => r.id === editingId);
        if (!reg) return;
        if (reg.pessoaId) {
          await updateDocument(`eventos/${eventoId}/pessoas`, reg.pessoaId, {
            nome: formData.nome, email: formData.email, cpf: formData.cpf,
            telefone: formData.telefone, idade: Number(formData.idade),
            genero: formData.genero, celula: formData.celula,
          });
        }
        let newStatus: Inscricao['status'] = reg.status;
        if (formData.precisa_ajuda) {
          newStatus = 'ajuda_solicitada';
        } else {
          if (reg.valor_pago >= selectedTicket.valor) newStatus = 'pago';
          else if (reg.valor_pago > 0) newStatus = 'pagamento_iniciado';
          else newStatus = 'pendente';
        }
        const editUpdate: Record<string, any> = {
          ticketId: formData.ticketId, status: newStatus, valor_total: selectedTicket.valor,
          forma_pagamento: formData.forma_pagamento, precisa_ajuda: formData.precisa_ajuda,
        };
        if (selectedPagina) {
          const respostas: Record<string, string | boolean> = {};
          selectedPagina.campos_formulario.forEach(c => { respostas[c.label] = dynamicValues[c.id] ?? ''; });
          editUpdate.respostas_formulario = respostas;
          const nome = getDynValue('nome') || getDynValue('name') || formData.nome;
          editUpdate.nome = nome; editUpdate.email = getDynValue('email') || formData.email;
          editUpdate.telefone = getDynValue('telefone') || formData.telefone;
        }
        await updateDocument(`eventos/${eventoId}/inscricoes`, editingId, editUpdate);
        const pendingPayments = await listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [
          where('inscricaoId', '==', editingId), where('status', '==', 'pendente'),
        ]);
        for (const pay of pendingPayments) {
          await updateDocument(`eventos/${eventoId}/pagamentos`, pay.id, { metodo: formData.forma_pagamento as any });
        }
        toast.success('Inscrição atualizada!');
      } else {
        const pessoaId = uuidv4();
        const inscricaoId = uuidv4();
        const nome = selectedPagina ? (getDynValue('nome') || getDynValue('name') || getDynValue('texto')) : formData.nome;
        const email = selectedPagina ? getDynValue('email') : formData.email;
        const telefone = selectedPagina ? (getDynValue('telefone') || getDynValue('phone')) : formData.telefone;

        await createDocument(`eventos/${eventoId}/pessoas`, pessoaId, {
          id: pessoaId, nome: nome || formData.nome, email: email || formData.email,
          cpf: formData.cpf.replace(/\D/g, ''), telefone: telefone || formData.telefone,
          idade: Number(formData.idade), genero: formData.genero, celula: formData.celula,
        });
        await createDocument(`eventos/${eventoId}/inscricoes`, inscricaoId, {
          id: inscricaoId, pessoaId, eventoId, ticketId: formData.ticketId,
          ticket_nome: selectedTicket.nome, nome: nome || formData.nome,
          email: email || formData.email, telefone: telefone || formData.telefone,
          ...(formData.cpf ? { cpf: formData.cpf.replace(/\D/g, '') } : {}),
          status: initialStatus, valor_total: selectedTicket.valor, valor_pago: 0,
          forma_pagamento: formData.forma_pagamento, precisa_ajuda: formData.precisa_ajuda,
          validada_manual: true, data_inscricao: new Date().toISOString(),
          ...(selectedPagina ? {
            paginaVendaId: selectedPagina.id,
            respostas_formulario: Object.fromEntries(
              selectedPagina.campos_formulario.map(c => [c.label, dynamicValues[c.id] ?? ''])
            ),
          } : {}),
        });
        const remaining = selectedTicket.valor;
        if (remaining > 0 && formData.parcelas > 0) {
          const installmentValue = remaining / formData.parcelas;
          for (let i = 1; i <= formData.parcelas; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i - 1);
            const pagamentoId = uuidv4();
            await createDocument(`eventos/${eventoId}/pagamentos`, pagamentoId, {
              id: pagamentoId, inscricaoId, eventoId, valor: installmentValue,
              status: 'pendente', metodo: formData.forma_pagamento as any,
              data_vencimento: dueDate.toISOString().split('T')[0], origem: 'manual',
            });
          }
        }
        const participanteEmail = email || formData.email;
        const participanteNome  = nome || formData.nome;
        if (participanteEmail) {
          const cfgEmail = evento?.config_comunicacao?.email_confirmacao;
          if (cfgEmail?.ativo && cfgEmail.corpo) {
            const vars = { nome: participanteNome, evento: evento?.nome || '', data: evento?.data_inicio ? new Date(evento.data_inicio).toLocaleDateString('pt-BR') : '', local: evento?.local || '' };
            Email.custom(participanteEmail, interpolate(cfgEmail.assunto || `Inscrição confirmada: ${evento?.nome}`, vars), interpolate(cfgEmail.corpo, vars), `Inscrição confirmada em ${evento?.nome}`);
          } else {
            Email.confirmacaoInscricao(participanteEmail, participanteNome, evento?.nome || '', evento?.data_inicio ? new Date(evento.data_inicio).toLocaleDateString('pt-BR') : '', evento?.local || '');
          }
        }
        toast.success('Inscrição manual realizada!');
      }

      setIsDialogOpen(false);
      setEditingId(null);
      setSelectedPagina(null);
      setDynamicValues({});
      fetchData();
      resetForm();
    } catch {
      toast.error('Erro ao processar inscrição.');
    }
  };

  const handleEdit = (reg: Inscricao & { pessoa?: Pessoa }) => {
    const paginaId = reg.paginaVendaId || reg.pagina_venda_id;
    const pagina = paginaId ? paginas.find(p => p.id === paginaId) : null;
    if (pagina) {
      setSelectedPagina(pagina);
      const respostas = reg.respostas_formulario || {};
      const vals: Record<string, string | boolean> = {};
      pagina.campos_formulario.forEach(c => { vals[c.id] = respostas[c.label] ?? respostas[c.id] ?? ''; });
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
      precisa_ajuda: reg.precisa_ajuda || false,
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
      const payments = await listDocuments<Pagamento>(`eventos/${eventoId}/pagamentos`, [where('inscricaoId', '==', regId)]);
      for (const pay of payments) await removeDocument(`eventos/${eventoId}/pagamentos`, pay.id);
      await removeDocument(`eventos/${eventoId}/inscricoes`, regId);
      if (pessoaId) await removeDocument(`eventos/${eventoId}/pessoas`, pessoaId);
      toast.success('Inscrição excluída!');
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch {
      toast.error('Erro ao excluir inscrição.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => { setImportPreview(results.data); toast.success(`${results.data.length} registros encontrados no CSV.`); },
        error: () => toast.error('Erro ao ler o arquivo CSV.'),
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setImportPreview(data);
        toast.success(`${data.length} registros encontrados na planilha Excel.`);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls).');
    }
  };

  const processImport = async () => {
    if (!importTicketId) { toast.error('Selecione um lote (ingresso) para as novas inscrições.'); return; }
    if (importPreview.length === 0) { toast.error('Nenhum dado para importar.'); return; }
    setImportLoading(true);
    const selectedTicket = tickets.find(t => t.id === importTicketId);
    if (!selectedTicket) return;
    let successCount = 0, errorCount = 0;
    for (const row of importPreview) {
      try {
        const nome = row.nome || row.Nome || row.NOME || '';
        const email = row.email || row.Email || row.EMAIL || row.E_mail || '';
        if (!nome || !email) { errorCount++; continue; }
        const pessoaId = uuidv4();
        const inscricaoId = uuidv4();
        await createDocument(`eventos/${eventoId}/pessoas`, pessoaId, {
          id: pessoaId, nome, email, cpf: row.cpf || row.CPF || '',
          telefone: row.telefone || row.Telefone || row.whatsapp || row.WhatsApp || '',
          idade: Number(row.idade || row.Idade || 0),
          genero: (row.genero || row.Gênero || 'masculino').toLowerCase().includes('fem') ? 'feminino' : 'masculino',
          celula: row.celula || row.Célula || row.Celula || '',
        });
        await createDocument(`eventos/${eventoId}/inscricoes`, inscricaoId, {
          id: inscricaoId, pessoaId, eventoId, ticketId: importTicketId,
          status: importStatus === 'confirmada' ? 'pago' : 'pendente',
          valor_total: selectedTicket.valor,
          valor_pago: importStatus === 'confirmada' ? selectedTicket.valor : 0,
          forma_pagamento: 'importacao', precisa_ajuda: false,
          validada_manual: true, data_inscricao: new Date().toISOString(),
        });
        successCount++;
      } catch { errorCount++; }
    }
    setImportLoading(false);
    setIsImportDialogOpen(false);
    setImportPreview([]);
    setImportTicketId('');
    fetchData();
    if (errorCount > 0) toast.info(`Importação concluída: ${successCount} sucessos, ${errorCount} erros.`);
    else toast.success(`${successCount} inscrições importadas com sucesso!`);
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = searchTerm === '' || r.pessoa?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || r.pessoa?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNome = columnFilters.nome === '' || r.pessoa?.nome.toLowerCase().includes(columnFilters.nome.toLowerCase());
    const matchesTicket = columnFilters.ticket === '' || r.ticket?.nome.toLowerCase().includes(columnFilters.ticket.toLowerCase());
    const matchesStatus = columnFilters.status === '' || r.status.toLowerCase().includes(columnFilters.status.toLowerCase());
    const matchesMetodo = columnFilters.metodo === '' || (r.forma_pagamento || 'PIX').toLowerCase().includes(columnFilters.metodo.toLowerCase());
    const matchesCelula = columnFilters.celula === '' || (r.pessoa?.celula || '').toLowerCase().includes(columnFilters.celula.toLowerCase());
    const matchesFinanceiro = columnFilters.financeiro === '' || (r.valor_pago || 0).toString().includes(columnFilters.financeiro);
    return matchesSearch && matchesNome && matchesTicket && matchesStatus && matchesMetodo && matchesCelula && matchesFinanceiro;
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal: any = '', bVal: any = '';
    switch (sortConfig.key) {
      case 'nome': aVal = a.pessoa?.nome || ''; bVal = b.pessoa?.nome || ''; break;
      case 'ticket': aVal = a.ticket?.nome || ''; bVal = b.ticket?.nome || ''; break;
      case 'status': aVal = a.status || ''; bVal = b.status || ''; break;
      case 'financeiro': aVal = a.valor_pago || 0; bVal = b.valor_pago || 0; break;
      case 'metodo': aVal = a.forma_pagamento || 'PIX'; bVal = b.forma_pagamento || 'PIX'; break;
      case 'celula': aVal = a.pessoa?.celula || ''; bVal = b.pessoa?.celula || ''; break;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
  const paginatedRegistrations = filteredRegistrations.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const requestSort = (key: string) => {
    const direction: 'asc' | 'desc' = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

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
    const headers = [['Nome', 'Email', 'Telefone', 'CPF', 'Idade', 'Gênero', 'Célula']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'tovia_template_inscricoes.xlsx');
  };

  return {
    registrations, tickets, evento, loading, paginas,
    isDialogOpen, setIsDialogOpen,
    isImportDialogOpen, setIsImportDialogOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    qrInscricao, setQrInscricao,
    importLoading, importPreview, setImportPreview,
    importTicketId, setImportTicketId,
    importStatus, setImportStatus,
    exportFormat, setExportFormat,
    exportFields, setExportFields,
    EXPORT_FIELD_OPTIONS,
    itemToDelete, searchTerm, setSearchTerm,
    editingId, setEditingId,
    selectedPagina, setSelectedPagina,
    showPageSelector, setShowPageSelector,
    dynamicValues, setDynamicValues,
    currentPage, setCurrentPage,
    sortConfig, columnFilters, setColumnFilters,
    formData, setFormData,
    filteredRegistrations, paginatedRegistrations,
    totalPages, ITEMS_PER_PAGE,
    fetchData, resetForm, getDynValue, requestSort, getMaxParcelas,
    handleSubmit, handleEdit, handleDelete, confirmDelete,
    handleFileUpload, processImport, handleExport, downloadTemplate,
  };
}
