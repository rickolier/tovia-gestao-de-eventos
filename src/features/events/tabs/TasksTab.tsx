import React from 'react';
import { Task, EquipeMembro, MembroEquipeGlobal } from '~/types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTasks } from './hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare,
  ListTodo,
  Kanban,
  ArrowUpAZ,
  ArrowDownAZ,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  LayoutList,
  Link2,
  Link2Off,
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
import { useAuth } from '~/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES = ['Logística', 'Financeiro', 'Comunicados', 'Equipe', 'Infraestrutura', 'Outros'];
const STATUS_LIST = [
  { value: 'pendente', label: 'A Fazer', color: 'bg-muted text-muted-foreground' },
  { value: 'em_progresso', label: 'Em Andamento', color: 'bg-amber-100 text-amber-700' },
  { value: 'concluida', label: 'Concluído', color: 'bg-primary/10 text-primary' },
  { value: 'atrasada', label: 'Atrasado', color: 'bg-red-100 text-red-700' }
];

interface TasksTabProps {
  eventoId: string;
  equipe?: EquipeMembro[];
  donoId?: string;
  onEquipeUpdate?: () => void;
}

const DEFAULT_PERMS: EquipeMembro['permissoes'] = ['registrations', 'management', 'rooms', 'tasks'];

export default function TasksTab({ eventoId, equipe = [], donoId, onEquipeUpdate }: TasksTabProps) {
  const {
    tasks, setTasks, sortedTasks, sortConfig, requestSort,
    loading, isDialogOpen, setIsDialogOpen,
    editingTask, setEditingTask, view, setView,
    globalMembros, linkingId, isOwner, memberOptions,
    formData, setFormData,
    openForm, resetForm, handleSubmit, handleStatusChange,
    handleDelete, onDragEnd, handleVincular, handleDesvincular,
  } = useTasks(eventoId, equipe, donoId, onEquipeUpdate);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpAZ className="w-3 h-3 ml-2 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUpAZ className="w-3 h-3 ml-2 text-primary" />
      : <ArrowDownAZ className="w-3 h-3 ml-2 text-primary" />;
  };

  const SortableHeader = ({ columnKey, children }: { columnKey: string; children: React.ReactNode }) => (
    <button onClick={() => requestSort(columnKey)} className="flex items-center hover:text-primary transition-colors focus:outline-none">
      {children}
      <SortIcon columnKey={columnKey} />
    </button>
  );

  return (
    <div className="space-y-6 text-foreground">

      {/* ── Membros vinculados a este evento ── */}
      {isOwner && (
        <div className="bg-card rounded-3xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Membros neste evento
            </h3>
            {equipe.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                {equipe.length} vinculado{equipe.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {globalMembros.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum colaborador cadastrado ainda.{' '}
              <a href="/dashboard?tab=equipe" className="text-primary font-semibold hover:underline">
                Cadastre membros na sua Equipe.
              </a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {globalMembros.map(membro => {
                const semConta = !membro.userId;
                const vinculado = !semConta && equipe.some(m => m.userId === membro.userId);
                const busy = linkingId === membro.id;
                return (
                  <button
                    key={membro.id}
                    onClick={() => vinculado ? handleDesvincular(membro) : handleVincular(membro)}
                    disabled={busy || semConta}
                    title={
                      semConta
                        ? 'Aguardando cadastro no Tovia'
                        : vinculado ? 'Clique para desvincular' : 'Clique para vincular'
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-semibold transition-all ${
                      semConta
                        ? 'bg-muted border-dashed border-border text-muted-foreground/50 cursor-not-allowed'
                        : vinculado
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    } ${busy ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                      {(membro.nome || membro.email).charAt(0).toUpperCase()}
                    </span>
                    <span>{membro.nome || membro.email}</span>
                    {vinculado
                      ? <Link2Off className="w-3 h-3 shrink-0" />
                      : <Link2 className="w-3 h-3 shrink-0" />
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3">
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
        <Button onClick={() => openForm()} className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-5 font-black shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      <Tabs value={view}>
        <TabsContent value="lista" className="m-0">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden transition-colors">
            <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-widest py-5 px-6 group cursor-pointer" onClick={() => requestSort('titulo')}><SortableHeader columnKey="titulo">Tarefa</SortableHeader></TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-widest py-5 group cursor-pointer" onClick={() => requestSort('categoria')}><SortableHeader columnKey="categoria">Categoria</SortableHeader></TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-widest py-5 group cursor-pointer" onClick={() => requestSort('responsavel')}><SortableHeader columnKey="responsavel">Responsável</SortableHeader></TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-widest py-5 group cursor-pointer" onClick={() => requestSort('dataLimite')}><SortableHeader columnKey="dataLimite">Limite</SortableHeader></TableHead>
                  <TableHead className="font-semibold text-muted-foreground uppercase text-xs tracking-widest py-5 group cursor-pointer" onClick={() => requestSort('status')}><SortableHeader columnKey="status">Status</SortableHeader></TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground uppercase text-xs tracking-widest py-5 px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic font-medium">Nenhuma tarefa cadastrada para este evento.</TableCell>
                  </TableRow>
                ) : (
                  sortedTasks.map(task => (
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
                          <Button variant="ghost" size="icon" onClick={() => openForm(task)} className="rounded-lg h-8 w-8 text-muted-foreground/50 hover:text-primary hover:bg-primary/10">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="rounded-lg h-8 w-8 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
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
                          {statusTasks.map((task: Task, index: number) => (
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
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-snug font-medium italic">"{task.descricao}"</p>
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
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Título da Tarefa</Label>
              <Input 
                value={formData.titulo} 
                onChange={e => setFormData({...formData, titulo: e.target.value})} 
                placeholder="Ex: Contratar Buffet"
                className="rounded-xl bg-muted/50 border-none h-12 font-bold focus-visible:ring-primary shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Descrição</Label>
              <Textarea 
                value={formData.descricao} 
                onChange={e => setFormData({...formData, descricao: e.target.value})} 
                placeholder="Detalhes sobre a execução..."
                className="rounded-2xl border-none bg-muted/50 focus-visible:ring-primary shadow-sm min-h-[100px] font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Categoria</Label>
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
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Prioridade</Label>
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
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Responsável</Label>
                {memberOptions.length > 0 ? (
                  <Select value={formData.responsavel} onValueChange={v => setFormData({...formData, responsavel: v})}>
                    <SelectTrigger className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm">
                      <span>{formData.responsavel || <span className="text-muted-foreground font-normal">Selecione</span>}</span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {memberOptions.map(nome => (
                        <SelectItem key={nome} value={nome} className="font-medium">{nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.responsavel}
                    onChange={e => setFormData({...formData, responsavel: e.target.value})}
                    placeholder="Nome da pessoa"
                    className="rounded-xl border-none bg-muted/50 h-12 font-bold shadow-sm"
                    required
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Data Limite</Label>
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
                  variant="destructive"
                  onClick={() => handleDelete(editingTask.id)}
                  className="rounded-xl h-12 px-6 font-black shadow-lg shadow-destructive/20 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-muted-foreground hover:bg-muted">
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white w-full rounded-2xl h-12 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
