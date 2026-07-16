import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MockupVendas() {
  const pages = [
    { title: 'Acampamento Jovem 2026', tickets: 142, max: 200, color: 'bg-orange-500' },
    { title: 'Conferência de Mulheres', tickets: 89, max: 150, color: 'bg-violet-500' },
    { title: 'Retiro de Casais', tickets: 34, max: 60, color: 'bg-blue-500' },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % pages.length), 2200);
    return () => clearInterval(t);
  }, []);
  const page = pages[active];
  const pct = Math.round((page.tickets / page.max) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-border w-full max-w-sm mx-auto">
      <div className="bg-gray-100 border-b border-border px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 font-mono truncate ml-2">
          tovia.app/e/acampamento-jovem
        </div>
      </div>
      <div className="p-5 transition-all duration-500">
        <div className="flex gap-2 mb-4">
          {pages.map((p, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn('flex-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg transition-all', active === i ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
              {p.title.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 mb-4">
          <h4 className="text-sm font-black text-foreground leading-tight mb-1">{page.title}</h4>
          <p className="text-xs text-muted-foreground mb-3">Igreja Vida Nova · São Paulo</p>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-gray-500">{page.tickets}/{page.max} inscritos</span>
            <span className="text-[10px] font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-700', page.color)} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button className="w-full bg-primary text-white text-xs font-black py-2.5 rounded-xl">
          Inscrever-se agora
        </button>
      </div>
    </div>
  );
}

export function MockupDoacoes() {
  const [total, setTotal] = useState(4320);
  const [items, setItems] = useState([
    { name: 'Carlos M.', value: 150, time: '2min' },
    { name: 'Ana S.', value: 80, time: '5min' },
    { name: 'Rafael T.', value: 200, time: '12min' },
  ]);
  useEffect(() => {
    const names = ['Maria L.', 'João P.', 'Beatriz A.', 'Lucas F.', 'Sandra O.'];
    let idx = 0;
    const t = setInterval(() => {
      const value = [50, 100, 120, 180, 250][Math.floor(Math.random() * 5)];
      setTotal(p => p + value);
      setItems(prev => [{ name: names[idx % names.length], value, time: 'agora' }, ...prev.slice(0, 2)]);
      idx++;
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden w-full max-w-sm mx-auto">
      <div className="bg-gradient-to-br from-sidebar to-primary p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Total de Doações</p>
        <p className="text-3xl font-black transition-all duration-500">R$ {total.toLocaleString('pt-BR')}</p>
        <p className="text-xs text-white/60 mt-1">Acampamento Jovem 2026</p>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Últimas doações</p>
        {items.map((item, i) => (
          <div key={i} className={cn('flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-500', i === 0 ? 'bg-orange-50 border border-primary/20' : 'bg-gray-50')}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                {item.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.time}</p>
              </div>
            </div>
            <span className="text-sm font-black text-primary">+R${item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockupTarefas() {
  const allTasks = [
    { label: 'Confirmar local com equipe', done: true, assignee: 'Ana', tag: 'Logística' },
    { label: 'Enviar convites por email', done: true, assignee: 'Carlos', tag: 'Comunicação' },
    { label: 'Montar cronograma do evento', done: false, assignee: 'João', tag: 'Planejamento' },
    { label: 'Definir escala de voluntários', done: false, assignee: 'Maria', tag: 'Equipe' },
    { label: 'Revisar página de inscrições', done: false, assignee: 'Rafael', tag: 'Digital' },
  ];
  const [tasks, setTasks] = useState(allTasks);
  useEffect(() => {
    const t = setInterval(() => {
      setTasks(prev => {
        const firstUndone = prev.findIndex(t => !t.done);
        if (firstUndone === -1) return allTasks.map(t => ({ ...t, done: false }));
        return prev.map((t, i) => i === firstUndone ? { ...t, done: true } : t);
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);
  const done = tasks.filter(t => t.done).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden w-full max-w-sm mx-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-foreground">Tarefas do Evento</p>
          <p className="text-[10px] text-muted-foreground">Acampamento Jovem 2026</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">{done}/{tasks.length}</p>
          <p className="text-[10px] text-muted-foreground">concluídas</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100">
        <div className="h-full bg-primary transition-all duration-700 rounded-full" style={{ width: `${(done / tasks.length) * 100}%` }} />
      </div>
      <div className="p-3 space-y-1.5">
        {tasks.map((task, i) => (
          <div key={i} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500', task.done ? 'bg-orange-50' : 'bg-gray-50')}>
            <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300', task.done ? 'bg-orange-500 border-primary' : 'border-gray-300')}>
              {task.done && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-semibold truncate transition-all', task.done ? 'line-through text-muted-foreground' : 'text-foreground')}>{task.label}</p>
              <p className="text-[10px] text-muted-foreground">{task.assignee} · {task.tag}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
