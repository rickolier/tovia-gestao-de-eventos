import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { ArrowLeft, Send, Sparkles, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TIPOS_EVENTO = [
  { id: 'retiro', label: 'Retiro / Acampamento', emoji: '⛺' },
  { id: 'conferencia', label: 'Conferência / Congresso', emoji: '🎤' },
  { id: 'culto', label: 'Culto Especial / Celebração', emoji: '🙏' },
  { id: 'curso', label: 'Curso / Treinamento', emoji: '📚' },
  { id: 'encontro', label: 'Encontro / Reunião', emoji: '🤝' },
  { id: 'outro', label: 'Outro', emoji: '✨' },
];

const CORES_EVENTO = [
  { id: '#7C3AED', label: 'Roxo',    emoji: '🟣' },
  { id: '#10B981', label: 'Verde',   emoji: '🟢' },
  { id: '#FACC15', label: 'Amarelo', emoji: '🟡' },
  { id: '#EC4899', label: 'Rosa',    emoji: '🩷' },
  { id: '#3B82F6', label: 'Azul',    emoji: '🔵' },
  { id: '#F97316', label: 'Laranja', emoji: '🟠' },
];

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
  | 'instituicao'
  | 'descricao'
  | 'cor'
  | 'resumo'
  | 'criando'
  | 'pronto';

type EditableField = 'tipo' | 'nome' | 'participantes' | 'cobrar' | 'valor' | 'data_inicio' | 'data_fim' | 'local' | 'instituicao' | 'descricao' | 'cor';

interface Message {
  id: string;
  from: 'tov' | 'user';
  text: string;
  options?: { id: string; label: string; emoji?: string }[];
  inputType?: 'text' | 'number' | 'date' | 'datetime' | 'textarea';
  inputPlaceholder?: string;
  resumoData?: Record<string, string>;
}

interface DadosEvento {
  tipo: string;
  nome_evento: string;
  participantes: number;
  cobrar: boolean;
  valor_ingresso: number;
  data_inicio_data: string;
  data_inicio_hora: string;
  data_fim_data: string;
  data_fim_hora: string;
  local: string;
  instituicao: string;
  descricao: string;
  cor_tema: string;
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
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  const [dados, setDados] = useState<DadosEvento>({
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
    instituicao: '',
    descricao: '',
    cor_tema: '',
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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

  function addTovMessages(
    texts: string[],
    nextStep?: Step,
    options?: Message['options'],
    inputType?: Message['inputType'],
    inputPlaceholder?: string,
    resumoData?: Message['resumoData'],
  ) {
    let delay = 0;
    const msgs: Message[] = texts.map((text, i) => ({
      id: `tov-${Date.now()}-${i}`,
      from: 'tov' as const,
      text,
    }));

    const lastMsg = msgs[msgs.length - 1];
    if (options) lastMsg.options = options;
    if (inputType) {
      lastMsg.inputType = inputType;
      lastMsg.inputPlaceholder = inputPlaceholder;
    }
    if (resumoData) lastMsg.resumoData = resumoData;

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

  const goToStep = useCallback((targetStep: Step) => {
    switch (targetStep) {
      case 'tipo':
        addTovMessages(
          ['Que tipo de evento você vai organizar?'],
          'tipo',
          TIPOS_EVENTO.map(t => ({ id: t.id, label: t.label, emoji: t.emoji })),
        );
        break;
      case 'nome':
        addTovMessages(['Qual será o **nome do evento**?'], 'nome', undefined, 'text', 'Ex: Retiro de Jovens 2026');
        break;
      case 'participantes':
        addTovMessages([`Qual o número de **vagas**? (máx. ${plan.maxAttendeesPerEvent === Infinity ? '∞' : plan.maxAttendeesPerEvent})`], 'participantes', undefined, 'number', 'Ex: 100');
        break;
      case 'cobrar':
        addTovMessages(
          ['O evento vai **cobrar ingresso**?'],
          'cobrar',
          [
            { id: 'sim', label: 'Sim, vou cobrar', emoji: '💰' },
            { id: 'nao', label: 'Não, é gratuito', emoji: '🎁' },
          ],
        );
        break;
      case 'valor':
        addTovMessages(['Qual será o **valor do ingresso**?'], 'valor', undefined, 'number', 'Ex: 150');
        break;
      case 'data_inicio':
        addTovMessages(['Quando será o **início** do evento?'], 'data_inicio', undefined, 'datetime');
        break;
      case 'data_fim':
        addTovMessages(['Quando será o **fim** do evento?'], 'data_fim', undefined, 'datetime');
        break;
      case 'local':
        addTovMessages(['Qual será o **local** do evento?'], 'local', undefined, 'text', 'Ex: Igreja Central, São Paulo');
        break;
      case 'instituicao':
        addTovMessages(['Qual a **igreja ou instituição** responsável?'], 'instituicao', undefined, 'text', 'Ex: Igreja Batista Central');
        break;
      case 'descricao':
        addTovMessages(['Escreva uma **descrição** para o evento (opcional — envie vazio para pular):'], 'descricao', undefined, 'textarea', 'Descreva os detalhes do seu evento...');
        break;
      case 'cor':
        addTovMessages(
          ['Qual **cor do tema** do evento?'],
          'cor',
          [
            ...CORES_EVENTO.map(c => ({ id: c.id, label: c.label, emoji: c.emoji })),
            { id: 'aleatorio', label: 'Aleatória', emoji: '🎲' },
          ],
        );
        break;
    }
  }, [plan]);

  const FLOW: Step[] = ['tipo', 'nome', 'participantes', 'cobrar', 'data_inicio', 'data_fim', 'local', 'instituicao', 'descricao', 'cor'];

  function nextStepInFlow(current: Step): Step {
    if (current === 'cobrar' && dados.cobrar) return 'valor';
    if (current === 'valor') return 'data_inicio';
    const idx = FLOW.indexOf(current);
    if (idx >= 0 && idx < FLOW.length - 1) return FLOW[idx + 1];
    return 'resumo';
  }

  function advanceOrResume(currentStep: Step) {
    if (editingField) {
      setEditingField(null);
      setTimeout(() => showResumo(), 300);
    } else {
      const next = nextStepInFlow(currentStep);
      if (next === 'resumo') {
        setTimeout(() => showResumo(), 300);
      } else {
        setTimeout(() => goToStep(next), 300);
      }
    }
  }

  function handleOptionSelect(optionId: string, label: string) {
    addUserMessage(label);

    switch (step) {
      case 'tipo':
        setDados(d => ({ ...d, tipo: optionId }));
        setTimeout(() => {
          if (editingField) {
            setEditingField(null);
            setTimeout(() => showResumo(), 300);
          } else {
            addTovMessages(
              ['Ótima escolha! Agora me diga:', 'Qual será o **nome do evento**?'],
              'nome', undefined, 'text', 'Ex: Retiro de Jovens 2026',
            );
          }
        }, 300);
        break;

      case 'cobrar': {
        const vai = optionId === 'sim';
        setDados(d => ({ ...d, cobrar: vai, valor_ingresso: vai ? d.valor_ingresso : 0 }));
        setTimeout(() => {
          if (vai) {
            if (editingField) {
              addTovMessages(['Qual será o **valor do ingresso**?'], 'valor', undefined, 'number', 'Ex: 150');
            } else {
              addTovMessages(['Qual será o **valor do ingresso**?'], 'valor', undefined, 'number', 'Ex: 150');
            }
          } else {
            if (editingField) {
              setEditingField(null);
              setTimeout(() => showResumo(), 300);
            } else {
              addTovMessages(['Evento gratuito, excelente!', 'Quando será o **início** do evento?'], 'data_inicio', undefined, 'datetime');
            }
          }
        }, 300);
        break;
      }

      case 'cor': {
        const cor = optionId === 'aleatorio' ? '' : optionId;
        const corLabel = optionId === 'aleatorio' ? 'Aleatória' : CORES_EVENTO.find(c => c.id === optionId)?.label || optionId;
        setDados(d => ({ ...d, cor_tema: cor }));
        setTimeout(() => {
          if (editingField) {
            setEditingField(null);
            setTimeout(() => showResumo(), 300);
          } else {
            setTimeout(() => showResumo(), 300);
          }
        }, 300);
        break;
      }
    }
  }

  function handleSubmitInput() {
    const val = inputValue.trim();

    if (step === 'descricao' && !val) {
      addUserMessage('(pular)');
      setInputValue('');
      setDados(d => ({ ...d, descricao: '' }));
      advanceOrResume('descricao');
      return;
    }

    if (!val) return;

    addUserMessage(val);
    setInputValue('');

    switch (step) {
      case 'nome':
        setDados(d => ({ ...d, nome_evento: val }));
        if (editingField) {
          setEditingField(null);
          setTimeout(() => showResumo(), 300);
        } else {
          setTimeout(() => {
            addTovMessages(
              [`"${val}" — ótimo nome!`, `Qual o número de **vagas**? (máx. ${plan.maxAttendeesPerEvent === Infinity ? '∞' : plan.maxAttendeesPerEvent})`],
              'participantes', undefined, 'number', 'Ex: 100',
            );
          }, 300);
        }
        break;

      case 'participantes': {
        const num = parseInt(val.replace(/\D/g, ''));
        if (!num || num <= 0) {
          setTimeout(() => addTovMessages(['Preciso de um número válido de participantes.'], 'participantes', undefined, 'number', 'Ex: 100'), 200);
          return;
        }
        if (num > plan.maxAttendeesPerEvent) {
          setTimeout(() => addTovMessages([`Seu plano permite no máximo **${plan.maxAttendeesPerEvent}** participantes.`], 'participantes', undefined, 'number', 'Ex: 100'), 200);
          return;
        }
        setDados(d => ({ ...d, participantes: num }));
        if (editingField) {
          setEditingField(null);
          setTimeout(() => showResumo(), 300);
        } else {
          setTimeout(() => {
            addTovMessages(
              [`${num} participantes, anotado!`, 'O evento vai **cobrar ingresso**?'],
              'cobrar',
              [
                { id: 'sim', label: 'Sim, vou cobrar', emoji: '💰' },
                { id: 'nao', label: 'Não, é gratuito', emoji: '🎁' },
              ],
            );
          }, 300);
        }
        break;
      }

      case 'valor': {
        const valor = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!valor || valor <= 0) {
          setTimeout(() => addTovMessages(['Preciso de um valor válido. Ex: 150'], 'valor', undefined, 'number', 'Ex: 150'), 200);
          return;
        }
        setDados(d => ({ ...d, valor_ingresso: valor }));
        advanceOrResume('valor');
        break;
      }

      case 'data_inicio': {
        setDados(d => {
          const [data, hora] = val.split('T');
          return { ...d, data_inicio_data: data, data_inicio_hora: hora || '09:00' };
        });
        advanceOrResume('data_inicio');
        break;
      }

      case 'data_fim': {
        setDados(d => {
          const [data, hora] = val.split('T');
          return { ...d, data_fim_data: data, data_fim_hora: hora || '18:00' };
        });
        advanceOrResume('data_fim');
        break;
      }

      case 'local':
        setDados(d => ({ ...d, local: val }));
        if (editingField) {
          setEditingField(null);
          setTimeout(() => showResumo(), 300);
        } else {
          setTimeout(() => {
            addTovMessages(['Qual a **igreja ou instituição** responsável?'], 'instituicao', undefined, 'text', 'Ex: Igreja Batista Central');
          }, 300);
        }
        break;

      case 'instituicao':
        setDados(d => ({ ...d, instituicao: val }));
        advanceOrResume('instituicao');
        break;

      case 'descricao':
        setDados(d => ({ ...d, descricao: val }));
        advanceOrResume('descricao');
        break;
    }
  }

  function buildResumoData(d: DadosEvento): Record<string, string> {
    const tipoLabel = TIPOS_EVENTO.find(t => t.id === d.tipo)?.label || d.tipo;
    const dataIni = d.data_inicio_data ? new Date(`${d.data_inicio_data}T${d.data_inicio_hora}`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const dataFim = d.data_fim_data ? new Date(`${d.data_fim_data}T${d.data_fim_hora}`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const corLabel = d.cor_tema ? (CORES_EVENTO.find(c => c.id === d.cor_tema)?.label || d.cor_tema) : 'Aleatória';

    return {
      'tipo': tipoLabel,
      'nome': d.nome_evento,
      'participantes': `${d.participantes} vagas`,
      'valor': d.cobrar ? `R$ ${d.valor_ingresso.toFixed(2).replace('.', ',')}` : 'Gratuito',
      'inicio': dataIni,
      'fim': dataFim,
      'local': d.local,
      'instituicao': d.instituicao || '(não informado)',
      'descricao': d.descricao || '(sem descrição)',
      'cor': corLabel,
    };
  }

  function showResumo() {
    const resumoData = buildResumoData(dados);
    addTovMessages(
      ['Aqui está o resumo do seu evento. Clique em qualquer campo para editar:'],
      'resumo',
      [
        { id: 'criar', label: 'Criar evento!', emoji: '🚀' },
        { id: 'refazer', label: 'Recomeçar do zero', emoji: '🔄' },
      ],
      undefined, undefined,
      resumoData,
    );
  }

  function handleEditField(field: EditableField) {
    setEditingField(field);

    const fieldToStep: Record<EditableField, Step> = {
      tipo: 'tipo', nome: 'nome', participantes: 'participantes',
      cobrar: 'cobrar', valor: 'valor',
      data_inicio: 'data_inicio', data_fim: 'data_fim',
      local: 'local', instituicao: 'instituicao',
      descricao: 'descricao', cor: 'cor',
    };

    addUserMessage(`Quero alterar: ${field}`);
    setTimeout(() => goToStep(fieldToStep[field]), 300);
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
      const corFinal = dados.cor_tema || ['#7C3AED', '#10B981', '#FACC15', '#EC4899', '#3B82F6', '#F97316'][Math.floor(Math.random() * 6)];

      const dadosEvento = {
        codigo: gerarCodigoEvento(),
        nome: dados.nome_evento,
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        local: dados.local,
        instituicao: dados.instituicao || profile?.instituicao || '',
        descricao: dados.descricao || '',
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
        setDados({
          tipo: '', nome_evento: '', participantes: 0, cobrar: false,
          valor_ingresso: 0, data_inicio_data: '', data_inicio_hora: '',
          data_fim_data: '', data_fim_hora: '', local: '',
          instituicao: '', descricao: '', cor_tema: '',
        });
        setEditingField(null);
        addTovMessages([
          `Sem problemas, ${nome}! Vamos recomeçar.`,
          'Que tipo de evento você vai organizar?',
        ], 'tipo', TIPOS_EVENTO.map(t => ({ id: t.id, label: t.label, emoji: t.emoji })));
      }, 300);
    }
  }

  const lastMsg = messages[messages.length - 1];
  const showOptions = lastMsg?.from === 'tov' && lastMsg.options && !isTyping;
  const showInput = lastMsg?.from === 'tov' && lastMsg.inputType && !isTyping;
  const showDatetime = step === 'data_inicio' || step === 'data_fim';
  const showTextarea = step === 'descricao';

  useEffect(() => {
    if (step === 'tipo' && messages.length > 0 && !messages.some(m => m.options)) {
      setMessages(prev => [
        ...prev,
        {
          id: `tov-tipo-${Date.now()}`,
          from: 'tov',
          text: 'Que tipo de evento você vai organizar?',
          options: TIPOS_EVENTO.map(t => ({ id: t.id, label: t.label, emoji: t.emoji })),
        },
      ]);
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

  const RESUMO_FIELDS: { key: string; label: string; editField: EditableField }[] = [
    { key: 'tipo', label: 'Tipo', editField: 'tipo' },
    { key: 'nome', label: 'Nome', editField: 'nome' },
    { key: 'participantes', label: 'Vagas', editField: 'participantes' },
    { key: 'valor', label: 'Valor', editField: dados.cobrar ? 'valor' : 'cobrar' },
    { key: 'inicio', label: 'Início', editField: 'data_inicio' },
    { key: 'fim', label: 'Término', editField: 'data_fim' },
    { key: 'local', label: 'Local', editField: 'local' },
    { key: 'instituicao', label: 'Instituição', editField: 'instituicao' },
    { key: 'descricao', label: 'Descrição', editField: 'descricao' },
    { key: 'cor', label: 'Cor do tema', editField: 'cor' },
  ];

  function renderResumoCard(data: Record<string, string>) {
    return (
      <div className="mt-2 space-y-1">
        {RESUMO_FIELDS.map(({ key, label, editField }) => (
          <div key={key} className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg hover:bg-white/5 group transition-colors">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">{label}</span>
              <span className="text-sm text-white truncate block">{data[key]}</span>
            </div>
            <button
              onClick={() => handleEditField(editField)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/10 hover:bg-primary/80 text-white/60 hover:text-white transition-all shrink-0"
              title={`Editar ${label.toLowerCase()}`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
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
        {editingField && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full">
            Editando
          </span>
        )}
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
                {msg.resumoData && renderResumoCard(msg.resumoData)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {/* Options */}
        {showOptions && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 pl-2">
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-2">
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
      {(showInput || showDatetime || showTextarea) && !isTyping && step !== 'pronto' && step !== 'criando' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-sidebar border-t border-white/10 px-4 py-3"
        >
          <div className="flex gap-2 max-w-2xl mx-auto">
            {showTextarea ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitInput();
                  }
                }}
                placeholder={lastMsg?.inputPlaceholder || 'Escreva aqui...'}
                rows={3}
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={showDatetime ? 'datetime-local' : lastMsg?.inputType === 'number' ? 'number' : 'text'}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitInput()}
                placeholder={lastMsg?.inputPlaceholder || 'Escreva aqui...'}
                className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            )}
            <button
              onClick={handleSubmitInput}
              disabled={step !== 'descricao' && !inputValue.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-all active:scale-95 self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {step === 'descricao' && (
            <p className="text-[10px] text-white/30 text-center mt-1.5">Shift+Enter para nova linha · Enter para enviar · vazio para pular</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
