import React, { useEffect, useState } from 'react';
import { listDocuments, createDocument, updateDocument, removeDocument } from '../../lib/firebase-utils';
import { Task, AppNotification } from '../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  ListTodo, 
  Kanban, 
  Calendar as CalendarIcon, 
  Users, 
  Clock,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  LayoutList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES = ['Logística', 'Financeiro', 'Comunicados', 'Equipe', 'Infraestrutura', 'Outros'];
const STATUS_LIST = [
  { value: 'pendente', label: 'A Fazer', color: 'bg-muted text-muted-foreground' },
  { value: 'em_progresso', label: 'Em Andamento', color: 'bg-amber-100 text-amber-700' },
  { value: 'concluida', label: 'Concluído', color: 'bg-primary/10 text-primary' },
  { value: 'atrasada', label: 'Atrasado', color: 'bg-red-100 text-red-700' }
];

export default function TasksTab({ eventoId }: { eventoId: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<'lista' | 'quadros'>('quadros');

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Outros',
    responsavel: '',
    dataLimite: new Date().toISOString().split('T')[0],
    prioridade: 'media' as 'baixa' | 'media' | 'alta'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listDocuments<Task>(`eventos/${eventoId}/tarefas`);
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventoId]);

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
        prioridade: formData.prioridade
      };

      if (editingTask) {
        await updateDocument(`eventos/${eventoId}/tarefas`, taskId, taskData);
        toast.success('Tarefa atualizada!');
      } else {
        await createDocument(`eventos/${eventoId}/tarefas`, taskId, taskData);
        
        // Notificar responsável
        if (user) {
          const notifId = uuidv4();
          await createDocument('notificacoes', notifId, {
            id: notifId,
            userId: user.uid, // In a real app, this would be the ID of the 'responsavel'
            eventoId,
            tipo: 'tarefa',
            titulo: 'Nova Tarefa Atribuída',
            mensagem: `Você recebeu a tarefa: ${formData.titulo}`,
            data: new Date().toISOString(),
            lida: false
          } as AppNotification);
        }
        
        toast.success('Tarefa criada!');
      }

      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar tarefa.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateDocument(`eventos/${eventoId}/tarefas`, taskId, { status: newStatus });
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeDocument(`eventos/${eventoId}/tarefas`, id);
      toast.success('Tarefa removida');
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      categoria: 'Outros',
      responsavel: '',
      dataLimite: new Date().toISOString().split('T')[0],
      prioridade: 'media'
    });
  };

  const openForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        titulo: task.titulo,
        descricao: task.descricao,
        categoria: task.categoria,
        responsavel: task.responsavel,
        dataLimite: task.dataLimite,
        prioridade: task.prioridade
      });
    } else {
      setEditingTask(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Task['status'];
    const taskId = draggableId;

    // Local update for immediate feedback
    const prevTasks = [...tasks];
    setTasks(prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await updateDocument(`eventos/${eventoId}/tarefas`, taskId, { status: newStatus });
      toast.success('Status atualizado');
    } catch (error) {
      setTasks(prevTasks); // Revert on error
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Módulo Tarefas e Equipe</h2>
          <p className="text-sm text-muted-foreground font-medium">Organize a execução do seu evento com agilidade.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Tabs value={view} onValueChange={(v: any) => setView(v)} className="bg-muted p-1.5 rounded-2xl">
            <TabsList className="bg-transparent border-none">
              <TabsTrigger value="lista" className="rounded-xl gap-2 font-bold px-4 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <LayoutList className="w-4 h-4" />
                LISTA
              </TabsTrigger>
              <TabsTrigger value="quadros" className="rounded-xl gap-2 font-bold px-4 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Kanban className="w-4 h-4" />
                QUADROS
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => openForm()} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-11 px-6 font-black shadow-lg shadow-primary/20 flex-1 md:flex-none transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <Tabs value={view}>
        <TabsContent value="lista" className="m-0">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden transition-colors">
            <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest py-5 px-6">Tarefa</TableHead>
                  <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest py-5">Categoria</TableHead>
                  <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest py-5">Responsável</TableHead>
                  <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest py-5">Limite</TableHead>
                  <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest py-5">Status</TableHead>
                  <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest py-5 px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic font-medium">Nenhuma tarefa cadastrada para este evento.</TableCell>
                  </TableRow>
                ) : (
                  tasks.sort((a, b) => new Date(a.dataLimite).getTime() - new Date(b.dataLimite).getTime()).map(task => (
                    <TableRow key={task.id} className="hover:bg-muted/30 border-border/50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-foreground tracking-tight leading-tight">{task.titulo}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1 font-medium mt-1">{task.descricao}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5 uppercase text-[9px] tracking-wider px-2 h-5">{task.categoria}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-muted-foreground text-sm">
                        {task.responsavel}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">
                        {new Date(task.dataLimite).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_LIST.find(s => s.value === task.status)?.color} border-none font-black text-[9px] tracking-widest uppercase h-5`}>
                          {STATUS_LIST.find(s => s.value === task.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openForm(task)} className="rounded-xl h-9 w-9 text-muted-foreground/50 hover:text-primary hover:bg-primary/10">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="rounded-xl h-9 w-9 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>


        <TabsContent value="quadros" className="m-0">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {STATUS_LIST.map(st => {
                const statusTasks = tasks.filter(t => t.status === st.value);
                return (
                  <div key={st.value} className="space-y-4 bg-muted/30 p-2 rounded-[2rem] border border-border/50 min-h-[600px] flex flex-col transition-colors">
                    <div className="flex items-center justify-between px-3 mb-2 mt-2">
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${st.color.split(' ')[0]}`} />
                        {st.label}
                      </h3>
                      <Badge variant="outline" className="rounded-full bg-card text-[9px] h-5 min-w-[24px] justify-center px-1 font-black shadow-sm border-border">
                        {statusTasks.length}
                      </Badge>
                    </div>
                    
                    <Droppable droppableId={st.value}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 space-y-3.5 transition-all p-1.5 rounded-[1.5rem] ${snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''}`}
                        >
                          {statusTasks.map((task, index) => (
                            // @ts-ignore
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(draggableProvided, draggableSnapshot) => (
                                <Card 
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className={`border-none shadow-sm rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all group bg-card overflow-hidden ${draggableSnapshot.isDragging ? 'ring-2 ring-primary ring-offset-4 dark:ring-offset-background shadow-2xl opacity-90' : ''}`}
                                >
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <Badge className={`${CATEGORIES.indexOf(task.categoria) % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-primary/5 text-primary'} border-none text-[9px] h-4.5 px-2 font-black uppercase tracking-wider`}>
                                        {task.categoria}
                                      </Badge>
                                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all scale-90 -mr-1">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg" 
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => { e.stopPropagation(); openForm(task); }}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg" 
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                    </div>
                                    <div>
                                      <h4 className="text-base font-black text-foreground line-clamp-2 leading-tight tracking-tight">{task.titulo}</h4>
                                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-snug font-medium italic">"{task.descricao}"</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-1">
                                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="w-3 h-3 text-primary" />
                                          {new Date(task.dataLimite).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-foreground bg-muted px-2 py-1 rounded-lg">
                                          <Users className="w-3 h-3 text-primary" />
                                          {task.responsavel}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {statusTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-24 border-2 border-dashed border-border/50 rounded-[1.5rem] flex flex-col items-center justify-center text-[10px] text-muted-foreground/30 font-black uppercase tracking-widest text-center p-6 gap-2 bg-muted/10">
                              <Plus className="w-4 h-4 opacity-20" />
                              Arraste tarefas aqui
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-lg border-none shadow-2xl p-8 bg-card transition-colors">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-black text-foreground tracking-tight">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <CheckSquare className="w-6 h-6 shrink-0" />
              </div>
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground pt-1">
              Preencha os detalhes da atividade para a equipe do evento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Título da Tarefa</Label>
              <Input 
                value={formData.titulo} 
                onChange={e => setFormData({...formData, titulo: e.target.value})} 
                placeholder="Ex: Contratar Buffet"
                className="rounded-xl bg-muted/50 border-none h-12 font-bold focus-visible:ring-primary shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Descrição</Label>
              <Textarea 
                value={formData.descricao} 
                onChange={e => setFormData({...formData, descricao: e.target.value})} 
                placeholder="Detalhes sobre a execução..."
                className="rounded-2xl border-none bg-muted/50 focus-visible:ring-primary shadow-sm min-h-[100px] font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Categoria</Label>
                <Select value={formData.categoria} onValueChange={v => setFormData({...formData, categoria: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-medium">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(v: any) => setFormData({...formData, prioridade: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="baixa" className="font-medium">🟢 Baixa</SelectItem>
                    <SelectItem value="media" className="font-medium">🟡 Média</SelectItem>
                    <SelectItem value="alta" className="font-medium">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Responsável</Label>
                <Input 
                  value={formData.responsavel} 
                  onChange={e => setFormData({...formData, responsavel: e.target.value})} 
                  placeholder="Nome da pessoa"
                  className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Data Limite</Label>
                <Input 
                  type="date"
                  value={formData.dataLimite} 
                  onChange={e => setFormData({...formData, dataLimite: e.target.value})} 
                  className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-6 flex flex-col md:flex-row gap-3">
              {editingTask && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleDelete(editingTask.id)} 
                  className="rounded-2xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white h-12 px-6 font-bold shadow-sm transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 px-6 font-bold text-muted-foreground hover:bg-muted">
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-12 h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-95">
                {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
