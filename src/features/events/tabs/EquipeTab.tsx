import React, { useState } from 'react';
import { updateDocument, listDocuments, createDocument } from '~/services/firestore';
import { Evento, EquipeMembro, EquipePermissao, UserProfile, ConvitePendente } from '~/types';
import { where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserPlus, Trash2, Mail, Users, ShieldCheck, Clock, Copy, CheckSquare, ArrowRight, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '~/context/AuthContext';
import { Email } from '~/services/email';
import { notifOnce } from '~/utils/notifications';
import { getPlanConfig } from '~/utils/plan-limits';
import { Link } from 'react-router-dom';
import TasksTab from './TasksTab';

const PERMISSAO_LABELS: Record<EquipePermissao, { label: string; desc: string }> = {
  registrations: { label: 'Ver inscritos',     desc: 'Acesso à lista de participantes' },
  management:    { label: 'Editar recursos',   desc: 'Acesso a recursos e calculadora' },
  rooms:         { label: 'Editar grupos',     desc: 'Acesso a quartos e grupos' },
  tasks:         { label: 'Editar tarefas',    desc: 'Acesso ao kanban de tarefas' },
  checkin:       { label: 'Realizar check-in', desc: 'Pode marcar presença de inscritos' },
};

const ALL_PERMS = Object.keys(PERMISSAO_LABELS) as EquipePermissao[];
const DEFAULT_PERMS: EquipePermissao[] = ['registrations', 'management', 'rooms', 'tasks'];

interface Props {
  evento: Evento;
  onUpdate: () => void;
}

export default function EquipeTab({ evento, onUpdate }: Props) {
  const { profile } = useAuth();
  const [subTab, setSubTab] = useState<'membros' | 'tarefas'>('membros');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<ConvitePendente[]>([]);
  const [loadedPending, setLoadedPending] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<EquipePermissao[]>(DEFAULT_PERMS);

  const isOwner = profile?.uid === evento.criado_por;
  const plan = getPlanConfig(profile?.plano);
  const equipe: EquipeMembro[] = evento.equipe || [];
  const atLimit = isFinite(plan.maxTeamMembers) && equipe.length >= plan.maxTeamMembers;

  React.useEffect(() => {
    if (loadedPending) return;
    listDocuments<ConvitePendente>('convites', [where('eventoId', '==', evento.id)])
      .then(data => { setPendingInvites(data); setLoadedPending(true); })
      .catch(() => setLoadedPending(true));
  }, [evento.id]);

  const togglePerm = (perm: EquipePermissao) => {
    setSelectedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const inviteLink = (inviteEmail: string) =>
    `${window.location.origin}/login?cadastro=true&eventoId=${evento.id}&inviteEmail=${encodeURIComponent(inviteEmail)}`;

  const handleConvidar = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (atLimit) {
      toast.error(`Limite de ${plan.maxTeamMembers} membros atingido. Faça upgrade para o plano Personalizado.`);
      return;
    }
    if (equipe.some(m => m.email === trimmed)) {
      toast.error('Este usuário já está na equipe.');
      return;
    }
    if (pendingInvites.some(c => c.email === trimmed)) {
      toast.error('Já existe um convite pendente para este e-mail.');
      return;
    }

    setLoading(true);
    try {
      const usuarios = await listDocuments<UserProfile>('users', [where('email', '==', trimmed)]);

      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        const novoMembro: EquipeMembro = {
          userId: usuario.uid,
          email: trimmed,
          nome: usuario.nome || trimmed,
          permissoes: selectedPerms,
          adicionadoEm: new Date().toISOString(),
        };
        await updateDocument('eventos', evento.id, {
          equipe: [...equipe, novoMembro],
          equipeIds: arrayUnion(usuario.uid),
        } as any);
        notifOnce(`eq_${evento.id}_${usuario.uid}`, {
          userId: evento.criado_por,
          eventoId: evento.id,
          tipo: 'equipe_novo_membro',
          titulo: 'Novo membro adicionado à equipe',
          mensagem: `${usuario.nome || trimmed} foi adicionado à equipe do evento "${evento.nome}".`,
          data: new Date().toISOString(),
          lida: false,
          acao_requirida: false,
          dados_acao: { membroEmail: trimmed, membroNome: usuario.nome, membroId: usuario.uid },
        }).catch(() => {});
        Email.confirmacaoVinculo(trimmed, usuario.nome || trimmed, evento.nome);
        toast.success(`${usuario.nome || trimmed} adicionado à equipe!`);
        onUpdate();
      } else {
        const conviteId = uuidv4();
        const convite: ConvitePendente = {
          id: conviteId,
          email: trimmed,
          eventoId: evento.id,
          eventoNome: evento.nome,
          donoNome: profile?.nome || 'Administrador',
          permissoes: selectedPerms,
          criadoEm: new Date().toISOString(),
        };
        await createDocument('convites', conviteId, convite);
        setPendingInvites(prev => [...prev, convite]);
        Email.conviteEquipe(trimmed, evento.nome, profile?.nome || 'Administrador');
        toast.success(`Convite enviado para ${trimmed}!`);
      }
      setEmail('');
    } catch {
      toast.error('Erro ao convidar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = async (userId: string) => {
    const nova = equipe.filter(m => m.userId !== userId);
    await updateDocument('eventos', evento.id, { equipe: nova, equipeIds: arrayRemove(userId) } as any);
    toast.success('Membro removido da equipe.');
    onUpdate();
  };

  const handleCancelarConvite = async (conviteId: string) => {
    const { removeDocument } = await import('~/services/firestore');
    await removeDocument('convites', conviteId);
    setPendingInvites(prev => prev.filter(c => c.id !== conviteId));
    toast.success('Convite cancelado.');
  };

  const togglePermissao = async (userId: string, perm: EquipePermissao) => {
    const nova = equipe.map(m => {
      if (m.userId !== userId) return m;
      const has = m.permissoes.includes(perm);
      return { ...m, permissoes: has ? m.permissoes.filter(p => p !== perm) : [...m.permissoes, perm] };
    });
    await updateDocument('eventos', evento.id, { equipe: nova });
    onUpdate();
  };

  return (
    <div>
      <div className="tab-page-header">
        <h2>Equipe</h2>
        <p>Membros e tarefas do evento.</p>
      </div>

      {/* Sub-tab navigation */}
      <div className="border-b border-border flex gap-1 mb-6">
        {isOwner && (
          <button
            onClick={() => setSubTab('membros')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
              subTab === 'membros' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" /> Membros
          </button>
        )}
        <button
          onClick={() => setSubTab('tarefas')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
            subTab === 'tarefas' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <CheckSquare className="w-4 h-4" /> Tarefas
        </button>
      </div>

      {subTab === 'tarefas' && <TasksTab eventoId={evento.id} />}

      {subTab === 'membros' && isOwner && (
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Contador de membros */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">
              {equipe.length}{isFinite(plan.maxTeamMembers) ? `/${plan.maxTeamMembers}` : ''} membro{equipe.length !== 1 ? 's' : ''}
            </p>
            {atLimit && (
              <Link to="/plans" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                <Crown className="w-3.5 h-3.5" /> Ampliar com plano Personalizado
              </Link>
            )}
          </div>

          {/* Convidar */}
          <div className={cn(
            'bg-card rounded-3xl border border-border p-6 space-y-5',
            atLimit && 'opacity-60 pointer-events-none'
          )}>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Convidar por e-mail
            </h3>

            {/* E-mail input */}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConvidar()}
                className="rounded-xl h-11"
                disabled={atLimit}
              />
              <Button
                onClick={handleConvidar}
                disabled={loading || !email.trim() || atLimit}
                className="rounded-xl h-11 px-6 font-bold shrink-0"
              >
                {loading ? 'Buscando...' : 'Convidar'}
              </Button>
            </div>

            {/* Permissions panel */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Permissões do convite
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_PERMS.map(perm => {
                  const ativo = selectedPerms.includes(perm);
                  const info = PERMISSAO_LABELS[perm];
                  return (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePerm(perm)}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                        ativo ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/20'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all',
                        ativo ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                      )}>
                        {ativo && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-none mb-0.5">{info.label}</p>
                        <p className="text-[10px] opacity-70">{info.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Link de cadastro */}
            {email.trim() && (
              <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Se o colaborador ainda não tem conta, envie este link:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background rounded-xl px-3 py-2 border border-border text-foreground truncate">
                    {inviteLink(email.trim())}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(inviteLink(email.trim())); toast.success('Link copiado!'); }}
                    className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  A conta deve ser criada com o e-mail <strong>{email.trim()}</strong> para que o acesso seja vinculado automaticamente.
                </p>
              </div>
            )}
          </div>

          {/* Convites pendentes */}
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Aguardando cadastro ({pendingInvites.length})
              </h3>
              {pendingInvites.map(convite => (
                <div key={convite.id} className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{convite.email}</p>
                        <p className="text-xs text-amber-600">Aguardando criação de conta</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { navigator.clipboard.writeText(inviteLink(convite.email)); toast.success('Link copiado!'); }}
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors"
                        title="Copiar link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCancelarConvite(convite.id)}
                        className="text-amber-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Cancelar convite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Perms do convite */}
                  <div className="flex flex-wrap gap-1.5">
                    {convite.permissoes.map(p => (
                      <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        {PERMISSAO_LABELS[p].label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Membros ativos */}
          {equipe.length === 0 && pendingInvites.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 flex flex-col items-center gap-3 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">Nenhum membro na equipe ainda</p>
              <p className="text-xs text-muted-foreground/60">Convide alguém pelo e-mail acima.</p>
            </div>
          ) : equipe.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                {equipe.length} membro{equipe.length !== 1 ? 's' : ''} ativo{equipe.length !== 1 ? 's' : ''}
              </h3>
              {equipe.map(membro => (
                <div key={membro.userId} className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-primary">
                          {(membro.nome || membro.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{membro.nome || membro.email}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {membro.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemover(membro.userId)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      title="Remover da equipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Permissões
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ALL_PERMS.map(perm => {
                        const ativo = membro.permissoes.includes(perm);
                        return (
                          <button
                            key={perm}
                            onClick={() => togglePermissao(membro.userId, perm)}
                            className={cn(
                              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
                              ativo ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', ativo ? 'bg-primary' : 'bg-muted-foreground/40')} />
                            {PERMISSAO_LABELS[perm].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
