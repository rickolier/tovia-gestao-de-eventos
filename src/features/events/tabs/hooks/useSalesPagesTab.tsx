import { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument, getDocument } from '~/services/firestore';
import { PaginaVenda, CampoFormulario, Ticket, Evento, UserProfile } from '~/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { gerarCodigoPagina } from '~/utils/codigos';

export const CAMPOS_PADRAO: Omit<CampoFormulario, 'id'>[] = [
  { tipo: 'texto',    label: 'Nome completo',    obrigatorio: true,  placeholder: 'Seu nome' },
  { tipo: 'email',    label: 'E-mail',           obrigatorio: true,  placeholder: 'seu@email.com' },
  { tipo: 'telefone', label: 'Telefone/WhatsApp', obrigatorio: true, placeholder: '(11) 9 0000-0000' },
  { tipo: 'select',   label: 'Gênero',           obrigatorio: false, opcoes: ['Masculino', 'Feminino', 'Prefiro não informar'] },
  { tipo: 'data',     label: 'Data de nascimento', obrigatorio: false },
  { tipo: 'texto',    label: 'CPF',              obrigatorio: false, placeholder: '000.000.000-00' },
  { tipo: 'texto',    label: 'Célula / Grupo',   obrigatorio: false, placeholder: 'Ex: Célula Centro' },
  { tipo: 'texto',    label: 'Igreja / Comunidade', obrigatorio: false, placeholder: '' },
  { tipo: 'textarea', label: 'Observações',      obrigatorio: false, placeholder: 'Alguma informação adicional?' },
];

export const TIPOS_CAMPO: { value: CampoFormulario['tipo']; label: string }[] = [
  { value: 'texto',    label: 'Texto simples' },
  { value: 'email',   label: 'E-mail' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'numero',  label: 'Número' },
  { value: 'data',    label: 'Data' },
  { value: 'select',  label: 'Seleção (dropdown)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Texto longo' },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
}

export const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

export function useSalesPagesTab(eventoId: string) {
  const [paginas, setPaginas] = useState<PaginaVenda[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'tickets' | 'campos'>('tickets');
  const [previewPagina, setPreviewPagina] = useState<PaginaVenda | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const emptyForm = (): Omit<PaginaVenda, 'id' | 'eventoId' | 'criado_em'> => ({
    nome: '',
    slug: '',
    ativa: true,
    descricao: '',
    ticketIds: [],
    campos_formulario: CAMPOS_PADRAO.slice(0, 3).map(c => ({ ...c, id: uuidv4() })),
  });
  const [form, setForm] = useState(emptyForm());

  const [novoCampo, setNovoCampo] = useState<Omit<CampoFormulario, 'id'>>({
    tipo: 'texto', label: '', obrigatorio: false, placeholder: '',
  });
  const [novaOpcao, setNovaOpcao] = useState('');

  useEffect(() => {
    listDocuments<PaginaVenda>(`eventos/${eventoId}/paginas_venda`).then(setPaginas).catch(() => {});
    listDocuments<Ticket>(`eventos/${eventoId}/tickets`).then(setTickets).catch(() => {});
    getDocument<Evento>('eventos', eventoId).then(e => {
      if (e) {
        setEvento({ ...e, id: eventoId });
        if (e.criado_por) {
          getDocument<UserProfile>('users', e.criado_por).then(p => { if (p) setOrganizerProfile(p); }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [eventoId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveSection('tickets');
    setIsDialogOpen(true);
  };

  const openEdit = (p: PaginaVenda) => {
    setEditingId(p.id);
    setForm({ nome: p.nome, slug: p.slug, ativa: p.ativa, descricao: p.descricao || '', ticketIds: p.ticketIds, campos_formulario: p.campos_formulario });
    setActiveSection('tickets');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome da página é obrigatório'); return; }
    if (!form.slug.trim()) { toast.error('Slug é obrigatório'); return; }
    if (form.ticketIds.length === 0) { toast.error('Selecione pelo menos um ingresso'); return; }

    const slug = slugify(form.slug);
    const conflict = paginas.find(p => p.slug === slug && p.id !== editingId);
    if (conflict) { toast.error('Já existe uma página com este slug. Escolha outro nome.'); return; }

    try {
      if (editingId) {
        const original = paginas.find(p => p.id === editingId)!;
        const updated: PaginaVenda = { ...original, ...form, slug };
        await createDocument(`eventos/${eventoId}/paginas_venda`, editingId, updated as any);
        setPaginas(prev => prev.map(p => p.id === editingId ? updated : p));
        toast.success('Página atualizada!');
      } else {
        const id = uuidv4();
        const nova: PaginaVenda = { id, eventoId, ...form, slug, codigo: gerarCodigoPagina(), criado_em: new Date().toISOString() };
        await createDocument(`eventos/${eventoId}/paginas_venda`, id, nova as any);
        setPaginas(prev => [...prev, nova]);
        toast.success('Página de vendas criada!');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Erro ao salvar página:', err);
      let msg = 'Erro ao salvar página';
      try { msg = JSON.parse(err.message)?.error || msg; } catch {}
      toast.error(msg);
    }
  };

  const toggleAtiva = async (p: PaginaVenda) => {
    try {
      await updateDocument(`eventos/${eventoId}/paginas_venda`, p.id, { ativa: !p.ativa });
      setPaginas(prev => prev.map(x => x.id === p.id ? { ...x, ativa: !x.ativa } : x));
    } catch { toast.error('Erro ao atualizar status'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeDocument(`eventos/${eventoId}/paginas_venda`, deleteId);
      setPaginas(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Página excluída');
      setDeleteId(null);
    } catch { toast.error('Erro ao excluir'); }
  };

  const getPageUrl = (p: PaginaVenda) =>
    organizerProfile?.codigo && evento?.codigo && p.codigo
      ? `${baseUrl}/${organizerProfile.codigo}/${evento.codigo}/${p.codigo}`
      : `${baseUrl}/e/${eventoId}/${p.slug}`;

  const copyLink = (p: PaginaVenda) => {
    navigator.clipboard.writeText(getPageUrl(p)).then(() => toast.success('Link copiado!'));
  };

  const exportarFicha = async (pagina: PaginaVenda) => {
    if (!evento) return;
    setExportingId(pagina.id);
    try {
      const [{ pdf }, { default: FichaInscricaoPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('~/features/pdf/FichaInscricaoPDF'),
      ]);
      const ticketsDaPagina = tickets.filter(t => pagina.ticketIds.includes(t.id));
      const blob = await pdf(
        <FichaInscricaoPDF
          evento={evento}
          pagina={pagina}
          tickets={ticketsDaPagina}
          organizerProfile={organizerProfile}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-inscricao-${pagina.slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Ficha exportada com sucesso!');
    } catch {
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setExportingId(null);
    }
  };

  const addCampoPadrao = (campo: Omit<CampoFormulario, 'id'>) => {
    setForm(prev => ({ ...prev, campos_formulario: [...prev.campos_formulario, { ...campo, id: uuidv4() }] }));
  };

  const addCampoCustom = () => {
    if (!novoCampo.label.trim()) { toast.error('Informe o nome do campo'); return; }
    setForm(prev => ({ ...prev, campos_formulario: [...prev.campos_formulario, { ...novoCampo, id: uuidv4() }] }));
    setNovoCampo({ tipo: 'texto', label: '', obrigatorio: false, placeholder: '', opcoes: [] });
    setNovaOpcao('');
  };

  const removeCampo = (id: string) => {
    setForm(prev => ({ ...prev, campos_formulario: prev.campos_formulario.filter(c => c.id !== id) }));
  };

  const moveCampo = (id: string, direction: 'up' | 'down') => {
    setForm(prev => {
      const arr = [...prev.campos_formulario];
      const idx = arr.findIndex(c => c.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return prev;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return { ...prev, campos_formulario: arr };
    });
  };

  const toggleCampoObrigatorio = (id: string) => {
    setForm(prev => ({
      ...prev,
      campos_formulario: prev.campos_formulario.map(c => c.id === id ? { ...c, obrigatorio: !c.obrigatorio } : c),
    }));
  };

  return {
    paginas, tickets, evento, organizerProfile,
    isDialogOpen, setIsDialogOpen,
    editingId,
    deleteId, setDeleteId,
    activeSection, setActiveSection,
    previewPagina, setPreviewPagina,
    previewKey, setPreviewKey,
    exportingId,
    form, setForm,
    novoCampo, setNovoCampo,
    novaOpcao, setNovaOpcao,
    openCreate, openEdit, handleSave,
    toggleAtiva, handleDelete,
    getPageUrl, copyLink, exportarFicha,
    addCampoPadrao, addCampoCustom, removeCampo, moveCampo, toggleCampoObrigatorio,
  };
}
