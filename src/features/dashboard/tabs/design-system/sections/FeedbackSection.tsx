import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Section } from '../shared';

const ALERTS = [
  { icon: CheckCircle2, label: 'Sucesso', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', iconCls: 'text-emerald-500', msg: 'Evento criado com sucesso! Você já pode gerenciar as inscrições.' },
  { icon: AlertTriangle, label: 'Aviso', cls: 'bg-amber-50 border-amber-200 text-amber-700', iconCls: 'text-amber-500', msg: 'Seu perfil está incompleto. Complete para liberar todos os recursos.' },
  { icon: XCircle, label: 'Erro', cls: 'bg-red-50 border-red-200 text-red-700', iconCls: 'text-red-500', msg: 'Erro ao salvar. Verifique sua conexão e tente novamente.' },
  { icon: Info, label: 'Info', cls: 'bg-blue-50 border-blue-200 text-blue-700', iconCls: 'text-blue-500', msg: 'Uma nova versão do Tovia está disponível com melhorias.' },
];

export function FeedbackSection() {
  return (
    <Section title="11. Feedback & Alertas" subtitle="Mensagens de estado e notificação ao usuário">
      <div className="space-y-3">
        {ALERTS.map(({ icon: Icon, label, cls, iconCls, msg }) => (
          <div key={label} className={`flex items-start gap-3 p-4 rounded-xl border ${cls}`}>
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconCls}`} />
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs mt-0.5 opacity-80">{msg}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
