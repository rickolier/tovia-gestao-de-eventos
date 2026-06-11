import React, { useEffect, useState } from 'react';
import { getDocument, updateDocument } from '../../lib/firebase-utils';
import { Evento, EquipeMembro, EquipePermissao } from '../../types';
import { listDocuments } from '../../lib/firebase-utils';
import { where } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserPlus, Trash2, Mail, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const PERMISSAO_LABELS: Record<EquipePermissao, string> = {
  registrations: 'Ver inscritos',
  management: 'Editar recursos',
  rooms: 'Editar grupos',
  tasks: 'Editar tarefas',
};

interface Props {
  evento: Evento;
  onUpdate: () => void;
}

export default function EquipeTab({ evento, onUpdate }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const equipe: EquipeMembro[] = evento.equipe || [];

  const handleConvidar = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (equipe.some(m => m.email === trimmed)) {
      toast.error('Este usuário já está na equipe.');
      return;
    }

    setLoading(true);
    try {
      // Buscar usuário pelo email
      const usuarios = await listDocuments<UserProfile>('users', [where('email', '==', trimmed)]);
      if (!usuarios.length) {
        toast.error('Nenhum usuário encontrado com esse e-mail. Peça para ele criar uma conta no Ekko primeiro.');
        setLoading(false);
        return;
      }

      const usuario = usuarios[0];
      const novoMembro: EquipeMembro = {
        userId: usuario.uid,
        email: trimmed,
        nome: usuario.nome || trimmed,
        permissoes: ['registrations', 'management', 'rooms', 'tasks'],
        adicionadoEm: new Date().toISOString(),
      };

      await updateDocument('eventos', evento.id, {
        equipe: [...equipe, novoMembro],
      });

      toast.success(`${usuario.nome || trimmed} adicionado à equipe!`);
      setEmail('');
      onUpdate();
    } catch (err) {
      toast.error('Erro ao convidar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = async (userId: string) => {
    const nova = equipe.filter(m => m.userId !== userId);
    await updateDocument('eventos', evento.id, { equipe: nova });
    toast.success('Membro removido da equipe.');
    onUpdate();
  };

  const togglePermissao = async (userId: string, perm: EquipePermissao) => {
    const nova = equipe.map(m => {
      if (m.userId !== userId) return m;
      const has = m.permissoes.includes(perm);
      return {
        ...m,
        permissoes: has ? m.permissoes.filter(p => p !== perm) : [...m.permissoes, perm],
      };
    });
    await updateDocument('eventos', evento.id, { equipe: nova });
    onUpdate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">Equipe do Evento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Convide colaboradores para ajudar na gestão. Eles não terão acesso ao financeiro nem às configurações do evento.
        </p>
      </div>

      {/* Convidar */}
      <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Convidar por e-mail
        </h3>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConvidar()}
            className="rounded-xl h-11"
          />
          <Button
            onClick={handleConvidar}
            disabled={loading || !email.trim()}
            className="rounded-xl h-11 px-6 font-bold"
          >
            {loading ? 'Buscando...' : 'Convidar'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O usuário precisa ter uma conta no Ekko. Qualquer plano é aceito.
        </p>
      </div>

      {/* Lista de membros */}
      {equipe.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 flex flex-col items-center gap-3 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">Nenhum membro na equipe ainda</p>
          <p className="text-xs text-muted-foreground/60">Convide alguém pelo e-mail acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
            {equipe.length} membro{equipe.length !== 1 ? 's' : ''}
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

              {/* Permissões */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Permissões
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PERMISSAO_LABELS) as EquipePermissao[]).map(perm => {
                    const ativo = membro.permissoes.includes(perm);
                    return (
                      <button
                        key={perm}
                        onClick={() => togglePermissao(membro.userId, perm)}
                        className={cn(
                          'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
                          ativo
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {ativo ? '✓ ' : ''}{PERMISSAO_LABELS[perm]}
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
  );
}
