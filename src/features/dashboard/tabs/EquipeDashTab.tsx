import React, { useState, useEffect } from 'react';
import { where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { listDocuments, createDocument, removeDocument } from '~/services/firestore';
import { MembroEquipeGlobal, UserProfile } from '~/types';
import { useAuth } from '~/context/AuthContext';
import { getPlanConfig } from '~/utils/plan-limits';
import { Email } from '~/services/email';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserPlus, Trash2, Mail, Users, Crown, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function EquipeDashTab() {
  const { user, profile } = useAuth();
  const [membros, setMembros] = useState<MembroEquipeGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const plan = getPlanConfig(profile?.plano);
  const atLimit = isFinite(plan.maxTeamMembers) && plan.maxTeamMembers > 0
    && membros.filter(m => m.status === 'ativo').length >= plan.maxTeamMembers;

  useEffect(() => {
    if (!user) return;
    listDocuments<MembroEquipeGlobal>('equipes', [where('donoId', '==', user.uid)])
      .then(data => setMembros(data))
      .catch(() => toast.error('Erro ao carregar equipe.'))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const handleAdicionar = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !user) return;

    if (atLimit) {
      toast.error(`Limite de ${plan.maxTeamMembers} membros atingido no ${plan.name}.`);
      return;
    }
    if (membros.some(m => m.email === trimmed)) {
      toast.error('Este e-mail já está na sua equipe.');
      return;
    }

    setSaving(true);
    try {
      const usuarios = await listDocuments<UserProfile>('users', [where('email', '==', trimmed)]);
      const usuario = usuarios[0];
      const id = uuidv4();
      const novoMembro: MembroEquipeGlobal = {
        id,
        donoId: user.uid,
        ...(usuario?.uid ? { userId: usuario.uid } : {}),
        email: trimmed,
        nome: usuario?.nome || trimmed,
        adicionadoEm: new Date().toISOString(),
        status: usuario ? 'ativo' : 'pendente',
      };
      await createDocument('equipes', id, novoMembro);
      setMembros(prev => [...prev, novoMembro]);
      setEmail('');
      if (!usuario) {
        Email.conviteEquipeGlobal(trimmed, profile?.nome || 'Um organizador').catch(() => {});
        toast.success(`Convite enviado para ${trimmed}. Ele aparecerá como ativo após o cadastro.`);
      } else {
        toast.success(`${usuario.nome} adicionado à equipe!`);
      }
    } catch {
      toast.error('Erro ao adicionar membro.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemover = async (id: string) => {
    try {
      await removeDocument('equipes', id);
      setMembros(prev => prev.filter(m => m.id !== id));
      toast.success('Membro removido da equipe.');
    } catch {
      toast.error('Erro ao remover membro.');
    }
  };

  if (plan.maxTeamMembers === 0) {
    return (
      <div>
        <div className="tab-page-header">
          <h2>Minha Equipe</h2>
          <p>Cadastre os colaboradores da sua equipe.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-border p-16 flex flex-col items-center gap-4 text-center max-w-lg mx-auto mt-8">
          <Crown className="w-10 h-10 text-primary/40" />
          <p className="font-bold text-foreground">Disponível a partir do Plano 3 - Koách</p>
          <p className="text-sm text-muted-foreground">
            Faça upgrade para cadastrar membros de equipe e vinculá-los a eventos específicos.
          </p>
          <Link to="/plans">
            <Button className="mt-2 rounded-xl">Ver planos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-page-header">
        <h2>Minha Equipe</h2>
        <p>
          Cadastre colaboradores aqui e vincule-os a eventos específicos na aba{' '}
          <strong>Tarefas</strong> de cada evento.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Formulário de adição */}
        <div className={cn(
          'bg-card rounded-3xl border border-border p-6 space-y-4',
          atLimit && 'opacity-60 pointer-events-none',
        )}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Adicionar membro
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground">
                {membros.filter(m => m.status === 'ativo').length}
                {isFinite(plan.maxTeamMembers) ? `/${plan.maxTeamMembers}` : ''} ativo
                {membros.filter(m => m.status === 'ativo').length !== 1 ? 's' : ''}
              </span>
              {atLimit && (
                <Link to="/plans" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  <Crown className="w-3.5 h-3.5" /> Ampliar
                </Link>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@colaborador.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
              className="rounded-xl h-11"
              disabled={atLimit}
            />
            <Button
              onClick={handleAdicionar}
              disabled={saving || !email.trim() || atLimit}
              className="rounded-xl h-11 px-6 font-bold shrink-0"
            >
              {saving ? 'Buscando...' : 'Adicionar'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            O colaborador precisa ter uma conta no Tovia. Após adicionado, abra um evento e vá em
            <strong> Tarefas</strong> para vinculá-lo àquele evento específico.
          </p>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : membros.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 flex flex-col items-center gap-3 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhum membro cadastrado ainda</p>
            <p className="text-xs text-muted-foreground/60">
              Adicione colaboradores pelo e-mail acima.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
              {membros.length} membro{membros.length !== 1 ? 's' : ''} cadastrado{membros.length !== 1 ? 's' : ''}
            </h3>
            {membros.map(membro => (
              <div
                key={membro.id}
                className="bg-card rounded-2xl border border-border px-5 py-4 flex items-center justify-between gap-3"
              >
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

                <div className="flex items-center gap-3">
                  {membro.status === 'ativo' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Aguardando cadastro
                    </span>
                  )}
                  <button
                    onClick={() => handleRemover(membro.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    title="Remover da equipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
