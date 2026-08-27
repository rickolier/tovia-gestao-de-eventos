import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '~/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { createDocument, updateDocument, listDocuments } from '~/services/firestore';
import { gerarCodigoEvento } from '~/utils/codigos';
import { Email } from '~/services/email';
import { where } from 'firebase/firestore';
import { getPlanConfig } from '~/utils/plan-limits';
import { v4 as uuidv4 } from 'uuid';
import { Evento } from '~/types';
import { toast } from 'sonner';
import { ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TIPOS_EVENTO = [
  { id: 'retiro', label: 'Retiro / Acampamento', emoji: '⛺' },
  { id: 'conferencia', label: 'Conferência / Congresso', emoji: '🎤' },
  { id: 'culto', label: 'Culto Especial / Celebração', emoji: '🙏' },
  { id: 'curso', label: 'Curso / Treinamento', emoji: '📚' },
  { id: 'encontro', label: 'Encontro / Reunião', emoji: '🤝' },
  { id: 'outro', label: 'Outro', emoji: '✨' },
];

const CORES_EVENTO = ['#7C3AED', '#10B981', '#FACC15', '#EC4899', '#3B82F6', '#F97316'];

type Step =
  | 'welcome'
  | 'tipo'
  | 'nome'
  | 'participantes'
  | 'cobrar'
  | 'valor'
  | 'data_inicio'
  | 'data_fim'
  | 'local'
  | 'resumo'
  | 'criando'
  | 'pronto';

interface Message {
  id: string;
  from: 'tov' | 'user';
  text: string;
  options?: { id: string; label: string; emoji?: string }[];
  inputType?: 'text' | 'number' | 'date' | 'datetime';
  inputPlaceholder?: string;
  inputMin?: number;
  inputMax?: number;
}

export default function TovChat() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const plan = getPlanConfig(profile?.plano);
  const nome = profile?.nome?.split(' ')[0] || 'organizador';

  const [step, setStep] = useState<Step>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Collected data
  const [dados, setDados] = useState({
    tipo: '',
    nome_evento: '',
    participantes: 0,
    cobrar: false,
    valor_ingresso: 0,
    data_inicio_data: '',
    data_inicio_hora: '',
    data_fim_data: '',
    data_fim_hora: '',
    local: '',
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (step === 'welcome') {
      addTovMessages([
        `Olá, ${nome}! Eu sou o **Tov**, seu assistente para criar eventos.`,
        'Vou te guiar passo a passo. Vamos começar?',
      ], 'tipo');
    }
  }, []);

  function addTovMessages(texts: string[], nextStep?: Step, options?: Message['options'], inputType?: Message['inputType'], inputPlaceholder?: string) {
    let delay = 0;
    const msgs: Message[] = texts.map((text, i) => ({
      id: `tov-${Date.now()}-${i}`,
      from: 'tov' as const,
      text,
    }));

    // Add options/input to last message
    if (options) msgs[msgs.length - 1].options = options;
    if (inputType) {
      msgs[msgs.length - 1].inputType = inputType;
      msgs[msgs.length - 1].inputPlaceholder = inputPlaceholder;
    }

    setIsTyping(true);
    msgs.forEach((msg, i) => {
      delay += 400 + Math.min(msg.text.length * 8, 800);
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        if (i === msgs.length - 1) {
          setIsTyping(false);
          if (nextStep) setStep(nextStep);
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }, delay);
    });
  }

  function addUserMessage(text: string) {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      from: 'user',
      text,
    }]);
  }

  function handleOptionSelect(optionId: string, label: string) {
    addUserMessage(label);

    switch (step) {
      case 'tipo':
        setDados(d => ({ ...d, tipo: optionId }));
        setTimeout(() => {
          addTovMessages(
            ['Ótima escolha! Agora me diga:', 'Qual será o **nome do evento**?'],
            'nome',
            undefined,
            'text',
            'Ex: Retiro de Jovens 2026'
          );
        }, 300);
        break;

      case 'cobrar':
        const vai = optionId === 'sim';
        setDados(d => ({ ...d, cobrar: vai }));
        setTimeout(() => {
          if (vai) {
            addTovMessages(
              ['Qual será o **valor do ingresso**?'],
              'valor',
              undefined,
              'number',
              'Ex: 150'
            );
          } else {
            addTovMessages(
              ['Evento gratuito, excelente!', 'Quando será o **início** do evento?'],
              'data_inicio',
              undefined,
              'datetime',
              ''
            );
          }
        }, 300);
        break;
    }
  }

  function handleSubmitInput() {
    const val = inputValue.trim();
    if (!val) return;

    addUserMessage(val);
    setInputValue('');

    switch (step) {
      case 'nome':
        setDados(d => ({ ...d, nome_evento: val }));
        setTimeout(() => {
          addTovMessages(
            [`"${val}" — ótimo nome!`, `Qual o número de **vagas** para esse evento? (máx. ${plan.maxAttendeesPerEvent === Infinity ? '∞' : plan.maxAttendeesPerEvent})`],
            'participantes',
            undefined,
            'number',
            'Ex: 100'
          );
        }, 300);
        break;

      case 'participantes': {
        const num = parseInt(val.replace(/\D/g, ''));
        if (!num || num <= 0) {
          setTimeout(() => addTovMessages(['Preciso de um número válido de participantes.'], 'participantes', undefined, 'number', 'Ex: 100'), 200);
          return;
        }
        if (num > plan.maxAttendeesPerEvent) {
          setTimeout(() => addTovMessages([`Seu plano permite no máximo **${plan.maxAttendeesPerEvent}** participantes. Digite um valor menor.`], 'participantes', undefined, 'number', 'Ex: 100'), 200);
          return;
        }
        setDados(d => ({ ...d, participantes: num }));
        setTimeout(() => {
          addTovMessages(
            [`${num} participantes, anotado!`, 'O evento vai **cobrar ingresso**?'],
            'cobrar',
            [
              { id: 'sim', label: 'Sim, vou cobrar', emoji: '💰' },
              { id: 'nao', label: 'Não, é gratuito', emoji: '🎁' },
            ]
          );
        }, 300);
        break;
      }

      case 'valor': {
        const valor = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!valor || valor <= 0) {
          setTimeout(() => addTovMessages(['Preciso de um valor válido. Ex: 150'], 'valor', undefined, 'number', 'Ex: 150'), 200);
          return;
        }
        setDados(d => ({ ...d, valor_ingresso: valor }));
        setTimeout(() => {
          addTovMessages(
            [`R$ ${valor.toFixed(2).replace('.', ',')} por ingresso!`, 'Quando será o **início** do evento?'],
            'data_inicio',
            undefined,
            'datetime',
            ''
          );
        }, 300);
        break;
      }

      case 'data_inicio': {
        // val comes from datetime-local input
        setDados(d => {
          const [data, hora] = val.split('T');
          return { ...d, data_inicio_data: data, data_inicio_hora: hora || '09:00' };
        });
        setTimeout(() => {
          addTovMessages(
            ['E quando será o **fim** do evento?'],
            'data_fim',
            undefined,
            'datetime',
            ''
          );
        }, 300);
        break;
      }

      case 'data_fim': {
        setDados(d => {
          const [data, hora] = val.split('T');
          return { ...d, data_fim_data: data, data_fim_hora: hora || '18:00' };
        });
        setTimeout(() => {
          addTovMessages(
            ['Quase lá! Qual será o **local** do evento?'],
            'local',
            undefined,
            'text',
            'Ex: Igreja Central, São Paulo'
          );
        }, 300);
        break;
      }

      case 'local':
        setDados(d => ({ ...d, local: val }));
        setTimeout(() => showResumo(val), 300);
        break;
    }
  }

  function showResumo(local: string) {
    const d = { ...dados, local };
    const tipoLabel = TIPOS_EVENTO.find(t => t.id === d.tipo)?.label || d.tipo;
    const dataIni = d.data_inicio_data ? new Date(`${d.data_inicio_data}T${d.data_inicio_hora}`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const dataFim = d.data_fim_data ? new Date(`${d.data_fim_data}T${d.data_fim_hora}`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    addTovMessages([
      'Perfeito! Aqui está o resumo do seu evento:',
      `📋 **${d.nome_evento}**\n🏷️ ${tipoLabel}\n👥 ${d.participantes} participantes\n${d.cobrar ? `💰 R$ ${d.valor_ingresso.toFixed(2).replace('.', ',')}` : '🎁 Gratuito'}\n📅 ${dataIni} → ${dataFim}\n📍 ${local}`,
      'Tudo certo? Posso criar o evento?',
    ], 'resumo', [
      { id: 'criar', label: 'Criar evento!', emoji: '🚀' },
      { id: 'refazer', label: 'Quero ajustar', emoji: '✏️' },
    ]);
  }

  async function criarEvento() {
    addUserMessage('Criar evento! 🚀');
    setStep('criando');

    setTimeout(() => {
      setIsTyping(true);
      setMessages(prev => [...prev, {
        id: `tov-creating-${Date.now()}`,
        from: 'tov',
        text: 'Criando seu evento...',
      }]);
    }, 200);

    try {
      if (!user) throw new Error('Não autenticado');

      const eventosAtivos = await listDocuments<Evento>('eventos', [where('criado_por', '==', user.uid)]);
      const ativos = eventosAtivos.filter(e => e.ativo);
      if (ativos.length >= plan.maxActiveEvents) {
        throw new Error(`Seu plano permite apenas ${plan.maxActiveEvents} evento(s) ativo(s).`);
      }

      const id = uuidv4();
      const dataInicioISO = new Date(`${dados.data_inicio_data}T${dados.data_inicio_hora}`).toISOString();
      const dataFimISO = new Date(`${dados.data_fim_data}T${dados.data_fim_hora}`).toISOString();
      const corFinal = CORES_EVENTO[Math.floor(Math.random() * CORES_EVENTO.length)];

      const dadosEvento = {
        codigo: gerarCodigoEvento(),
        nome: dados.nome_evento,
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        local: dados.local,
        instituicao: profile?.instituicao || '',
        descricao: '',
        vagas_totais: dados.participantes,
        imagem_url: '',
        cor_tema: corFinal,
        criado_por: user.uid,
        ativo: true,
        config_pagamento: {
          pix:            { ativo: true, taxa: 1.99, tipo_taxa: 'fixo' },
          debito:         { ativo: true, taxa: 1.99, tipo_taxa: 'porcentagem' },
          cartao_credito: { ativo: true, taxa: 2.99, tipo_taxa: 'porcentagem', parcelas_max: 12 },
          corrente:       { ativo: true, taxa: 4.99, tipo_taxa: 'porcentagem' },
          boleto:         { ativo: true, taxa: 1.99, tipo_taxa: 'fixo' },
          parcelamento_limite_data: true,
          installmentLogic: 'free',
        },
        config_comunicacao: {
          email_confirmacao: {
            assunto: `Inscrição Confirmada - ${dados.nome_evento}`,
            corpo: 'Olá, sua inscrição foi confirmada com sucesso!',
            ativo: true,
          },
          lembrete_evento: {
            dias_antes: 2,
            assunto: `Lembrete: ${dados.nome_evento} está chegando!`,
            corpo: 'Olá, este é um lembrete de que o evento começará em breve.',
            ativo: true,
          },
        },
        campos_customizados: [],
        valor_ticket_projeccao: dados.cobrar ? dados.valor_ingresso : 0,
        custo_estimado_por_pessoa: 0,
      };

      await createDocument('eventos', id, dadosEvento);
      setCreatedEventId(id);

      // Email de primeiro evento
      const todosEventos = await listDocuments<Evento>('eventos', [where('criado_por', '==', user.uid)]);
      if (todosEventos.length <= 1 && user.email && profile?.nome) {
        Email.primeiroEvento(user.email, profile.nome, dados.nome_evento);
      }

      setIsTyping(false);
      setStep('pronto');
      setMessages(prev => [...prev, {
        id: `tov-done-${Date.now()}`,
        from: 'tov',
        text: `Seu evento **${dados.nome_evento}** foi criado com sucesso! 🎉\n\nAgora você pode configurar ingressos, páginas de inscrição e muito mais.`,
      }]);
    } catch (err: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `tov-err-${Date.now()}`,
        from: 'tov',
        text: `Ops, algo deu errado: ${err.message}. Tente novamente.`,
      }]);
      setStep('resumo');
    }
  }

  function handleResumoOption(id: string, label: string) {
    if (id === 'criar') {
      criarEvento();
    } else {
      addUserMessage(label);
      setTimeout(() => {
        setStep('welcome');
        setMessages([]);
        setDados({ tipo: '', nome_evento: '', participantes: 0, cobrar: false, valor_ingresso: 0, data_inicio_data: '', data_inicio_hora: '', data_fim_data: '', data_fim_hora: '', local: '' });
        addTovMessages([
          `Sem problemas, ${nome}! Vamos recomeçar.`,
          'Que tipo de evento você vai organizar?',
        ], 'tipo', TIPOS_EVENTO.map(t => ({ id: t.id, label: t.label, emoji: t.emoji })));
      }, 300);
    }
  }

  // Determine what to show for current step input
  const lastMsg = messages[messages.length - 1];
  const showOptions = lastMsg?.from === 'tov' && lastMsg.options && !isTyping;
  const showInput = lastMsg?.from === 'tov' && lastMsg.inputType && !isTyping;
  const showDatetime = step === 'data_inicio' || step === 'data_fim';

  // On first render, trigger tipo options
  useEffect(() => {
    if (step === 'tipo' && messages.length > 0 && !messages.some(m => m.options)) {
      setMessages(prev => {
        const updated = [...prev];
        updated.push({
          id: `tov-tipo-${Date.now()}`,
          from: 'tov',
          text: 'Que tipo de evento você vai organizar?',
          options: TIPOS_EVENTO.map(t => ({ id: t.id, label: t.label, emoji: t.emoji })),
        });
        return updated;
      });
    }
  }, [step]);

  function renderMessageText(text: string) {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  }

  return (
    <div className="min-h-screen bg-sidebar flex flex-col">
      {/* Header */}
      <header className="bg-sidebar border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/dashboard" className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm">Tov</h1>
          <p className="text-white/50 text-xs">Assistente de criação de eventos</p>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.from === 'user'
                ? 'bg-primary text-white rounded-2xl rounded-br-md px-4 py-2.5'
                : 'bg-white/10 text-white rounded-2xl rounded-bl-md px-4 py-2.5'
              }`}>
                <p className="text-sm leading-relaxed">{renderMessageText(msg.text)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {/* Options */}
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 pl-2"
          >
            {lastMsg.options!.map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  if (step === 'resumo') handleResumoOption(opt.id, opt.label);
                  else handleOptionSelect(opt.id, `${opt.emoji || ''} ${opt.label}`.trim());
                }}
                className="bg-white/10 hover:bg-primary/80 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-primary"
              >
                {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}

        {/* Event created — go to event */}
        {step === 'pronto' && createdEventId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={() => navigate(`/eventos/${createdEventId}`)}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-2xl px-6 py-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30 flex items-center gap-2"
            >
              Abrir meu evento
              <span>→</span>
            </button>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {(showInput || showDatetime) && !isTyping && step !== 'pronto' && step !== 'criando' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-sidebar border-t border-white/10 px-4 py-3"
        >
          <div className="flex gap-2 max-w-2xl mx-auto">
            <input
              ref={inputRef}
              type={showDatetime ? 'datetime-local' : lastMsg?.inputType === 'number' ? 'number' : 'text'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitInput()}
              placeholder={lastMsg?.inputPlaceholder || 'Escreva aqui...'}
              min={lastMsg?.inputMin}
              max={lastMsg?.inputMax}
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
            <button
              onClick={handleSubmitInput}
              disabled={!inputValue.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
