import { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '~/services/firestore';
import { Task, AppNotification, EquipeMembro, MembroEquipeGlobal } from '~/types';
import { where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';

const DEFAULT_PERMS: EquipeMembro['permissoes'] = ['registrations', 'management', 'rooms', 'tasks'];

function emptyForm() {
  return {
    titulo: '',
    descricao: '',
    categoria: 'Outros',
    responsavel: '',
    dataLimite: new Date().toISOString().split('T')[0],
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
  };
}

export function useTasks(
  eventoId: string,
  equipe: EquipeMembro[] = [],
  donoId?: string,
  onEquipeUpdate?: () => void
) {
  const { user, profile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<'lista' | 'quadros'>('quadros');
  const [globalMembros, setGlobalMembros] = useState<MembroEquipeGlobal[]>([]);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm());

  const isOwner = !!donoId && user?.uid === donoId;

  const memberOptions: string[] = [
    ...(profile?.nome ? [profile.nome] : []),
    ...equipe.filter(m => m.userId !== user?.uid && m.nome).map(m => m.nome),
  ];

  useEffect(() => {
    if (!isOwner || !donoId) return;
    listDocuments<MembroEquipeGlobal>('equipes', [where('donoId', '==', donoId)])
      .then(data => setGlobalMembros(data.filter(m => m.status === 'ativo')))
      .catch(() => {});
  }, [donoId, isOwner]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listDocuments<Task>(`eventos/${eventoId}/tarefas`);
      setTasks(data);
    } catch {
      toast.error('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [eventoId]);

  const resetForm = () => setFormData(emptyForm());

  const openForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        titulo: task.titulo,
        descricao: task.descricao,
        categoria: task.categoria,
        responsavel: task.responsavel,
        dataLimite: task.dataLimite,
        prioridade: task.prioridade,
      });
    } else {
      setEditingTask(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskId = editingTask?.id || uuidv4();
      const taskData: Task = {
        ...formData,
        id: taskId,
        eventoId,
        status: editingTask?.status || 'pendente',
        dataCriacao: editingTask?.dataCriacao || new Date().toISOString(),
        prioridade: formData.prioridade,
      };

      if (editingTask) {
        await updateDocument(`eventos/${eventoId}/tarefas`, taskId, taskData);
        toast.success('Tarefa atualizada!');
      } else {
        await createDocument(`eventos/${eventoId}/tarefas`, taskId, taskData);
        if (user) {
          const notifId = uuidv4();
          await createDocument('notificacoes', notifId, {
            id: notifId,
            userId: user.uid,
            eventoId,
            tipo: 'tarefa',
            titulo: 'Nova Tarefa Atribuída',
            mensagem: `Você recebeu a tarefa: ${formData.titulo}`,
            data: new Date().toISOString(),
            lida: false,
          } as AppNotification);
        }
        toast.success('Tarefa criada!');
      }
      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
      fetchData();
    } catch {
      toast.error('Erro ao salvar tarefa.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateDocument(`eventos/${eventoId}/tarefas`, taskId, { status: newStatus });
      fetchData();
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeDocument(`eventos/${eventoId}/tarefas`, id);
      toast.success('Tarefa removida');
      setIsDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Task['status'];
    const prevTasks = [...tasks];
    setTasks(prevTasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));
    try {
      await updateDocument(`eventos/${eventoId}/tarefas`, draggableId, { status: newStatus });
      toast.success('Status atualizado');
    } catch {
      setTasks(prevTasks);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleVincular = async (membro: MembroEquipeGlobal) => {
    if (!membro.userId) {
      toast.error(`${membro.nome} ainda não tem conta no Tovia. Aguarde o cadastro.`);
      return;
    }
    if (equipe.some(m => m.userId === membro.userId)) return;
    setLinkingId(membro.id);
    try {
      const novoMembro: EquipeMembro = {
        userId: membro.userId,
        email: membro.email,
        nome: membro.nome,
        permissoes: DEFAULT_PERMS,
        adicionadoEm: new Date().toISOString(),
      };
      await updateDocument('eventos', eventoId, {
        equipe: [...equipe, novoMembro],
        equipeIds: arrayUnion(membro.userId),
      } as any);
      toast.success(`${membro.nome} vinculado a este evento.`);
      onEquipeUpdate?.();
    } catch {
      toast.error('Erro ao vincular membro.');
    } finally {
      setLinkingId(null);
    }
  };

  const handleDesvincular = async (membro: MembroEquipeGlobal) => {
    if (!membro.userId) return;
    setLinkingId(membro.id);
    try {
      const novaEquipe = equipe.filter(m => m.userId !== membro.userId);
      await updateDocument('eventos', eventoId, {
        equipe: novaEquipe,
        equipeIds: arrayRemove(membro.userId),
      } as any);
      toast.success(`${membro.nome} removido deste evento.`);
      onEquipeUpdate?.();
    } catch {
      toast.error('Erro ao desvincular membro.');
    } finally {
      setLinkingId(null);
    }
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    const direction: 'asc' | 'desc' = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortConfig) return new Date(a.dataLimite).getTime() - new Date(b.dataLimite).getTime();
    let aVal: any = '';
    let bVal: any = '';
    const prioMap: Record<string, number> = { alta: 3, media: 2, baixa: 1 };
    const statusMap: Record<string, number> = { pendente: 0, em_progresso: 1, atrasada: 2, concluida: 3 };
    switch (sortConfig.key) {
      case 'titulo': aVal = a.titulo.toLowerCase(); bVal = b.titulo.toLowerCase(); break;
      case 'categoria': aVal = a.categoria.toLowerCase(); bVal = b.categoria.toLowerCase(); break;
      case 'responsavel': aVal = a.responsavel.toLowerCase(); bVal = b.responsavel.toLowerCase(); break;
      case 'dataLimite': aVal = new Date(a.dataLimite).getTime(); bVal = new Date(b.dataLimite).getTime(); break;
      case 'status': aVal = statusMap[a.status] ?? 0; bVal = statusMap[b.status] ?? 0; break;
      case 'prioridade': aVal = prioMap[a.prioridade] ?? 0; bVal = prioMap[b.prioridade] ?? 0; break;
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return {
    tasks, setTasks, sortedTasks, sortConfig, requestSort,
    loading, isDialogOpen, setIsDialogOpen,
    editingTask, setEditingTask,
    view, setView,
    globalMembros, linkingId, isOwner,
    formData, setFormData, memberOptions,
    openForm, resetForm,
    handleSubmit, handleStatusChange, handleDelete, onDragEnd,
    handleVincular, handleDesvincular,
  };
}
