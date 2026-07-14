import React, { useState } from 'react';
import { db } from '~/services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { CheckCircle, Loader2, Users, Heart, Zap, ChevronDown, ArrowRight } from 'lucide-react';

const TIPOS_EVENTO = [
  'Conferência / Congresso',
  'Retiro / Acampamento',
  'Culto / Celebração',
  'Workshop / Treinamento',
  'Show / Festival',
  'Formatura / Cerimônia',
  'Feirinha / Bazar',
  'Outro',
];

const TAMANHOS = [
  { label: '0 – 100 pessoas', value: '0-100' },
  { label: '101 – 500 pessoas', value: '101-500' },
  { label: '500 – 2.000 pessoas', value: '500-2000' },
  { label: '2.000+ pessoas', value: '2000+' },
];

function maskWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a45] focus:border-transparent bg-white';

export default function CaptacaoPage() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    instituicao: '',
    tipo_evento: '',
    tamanho_publico: '',
  });
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'whatsapp' ? maskWhatsapp(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.whatsapp || !form.instituicao || !form.tipo_evento || !form.tamanho_publico) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (!lgpdConsent) {
      setErro('Você precisa aceitar a política de privacidade para continuar.');
      return;
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailValido) {
      setErro('Digite um e-mail válido.');
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        ...form,
        lgpd_consent: true,
        lgpd_consent_em: new Date().toISOString(),
        criado_em: new Date().toISOString(),
        origem: 'landing_captacao',
      });
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
          <span className="text-[#0f3d22] font-bold tracking-tight" style={{ fontSize: '1.6rem', fontFamily: 'inherit' }}>tovia</span>
          <div className="w-px h-7 bg-gray-300" />
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] leading-tight">
            Gestão de<br />Eventos
          </span>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f3d22] via-[#1e3d2a] to-[#1a7a45] pt-10 pb-16 px-6">
          {/* Decorative circles */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
          <div className="absolute top-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-emerald-400/20" />

          <div className="max-w-6xl mx-auto relative flex flex-col md:flex-row items-center gap-12">
            {/* Texto */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6 uppercase">
                Do zero ao check-in{' '}
                <span className="text-emerald-400">tudo em uma plataforma.</span>
              </h1>
              <p className="text-lg text-white/70 mb-10 max-w-xl leading-relaxed">
                Organize seu evento com inscrições, equipe, financeiro e check-in no mesmo lugar. Feito para igrejas, conferências, retiros e quem organiza com propósito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#formulario"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#0f3d22] font-black px-8 py-4 rounded-2xl hover:bg-white/90 transition-all shadow-2xl text-sm uppercase tracking-widest"
                >
                  Criar meu evento <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#solucao"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-sm"
                >
                  Ver como funciona <ChevronDown className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Hero visual — foto + elipse + cards flutuantes */}
            <div className="hidden md:flex flex-1 justify-center items-end relative" style={{ minHeight: '420px' }}>
              {/* Círculo de contraste */}
              <div className="absolute bottom-0 right-4 w-80 h-80 rounded-full bg-emerald-400/20 border border-emerald-400/30" />
              <div className="absolute bottom-6 right-10 w-64 h-64 rounded-full bg-white/5" />

              {/* Foto dentro da elipse */}
              <div
                className="relative z-10 overflow-hidden border-4 border-white/10"
                style={{
                  width: '420px',
                  height: '520px',
                  borderRadius: '50% 50% 50% 50% / 45% 45% 55% 55%',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src="/foto-hero.jpg"
                  alt="Organizador de eventos"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 20%', transform: 'scale(1.15)', transformOrigin: 'center 30%' }}
                />
              </div>

              {/* Card flutuante — inscrições */}
              <div className="absolute top-6 left-0 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Inscrições</p>
                  <p className="text-lg font-black text-gray-900 leading-none">142</p>
                </div>
              </div>

              {/* Card flutuante — doações */}
              <div className="absolute top-28 right-0 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Doações</p>
                  <p className="text-lg font-black text-gray-900 leading-none">R$ 4.320</p>
                </div>
              </div>

              {/* Card flutuante — evento criado */}
              <div className="absolute bottom-12 left-2 z-20 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Evento criado!</p>
                  <p className="text-[10px] text-gray-400">Em menos de 1 minuto</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── A Solução ── */}
        <section id="solucao" className="py-10 px-6 bg-white text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1a7a45] mb-2">A Solução</p>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
            Tovia — <span className="font-normal" style={{ fontFamily: 'serif' }}>טוֹבִיָּה</span>
          </h2>
          <div className="max-w-xl mx-auto space-y-2 text-gray-500 text-sm leading-relaxed">
            <p>
              O nome vem do hebraico antigo <strong>Toviyah</strong>, formado por duas raízes:{' '}
              <strong>Tov</strong> (טוֹב), que significa bondade, e <strong>Yah</strong> (יָהּ),
              forma abreviada do nome de Deus.
            </p>
            <p>
              Mas o que nos inspira vai além da tradução literal. Em hebraico, <em>tov</em> descreve algo
              que está cumprindo exatamente o propósito para o qual foi criado — uma ideia mais próxima de{' '}
              <strong>"funcionando como deveria"</strong> do que simplesmente "bom".
            </p>
            <p>
              É isso que o Tovia quer ser: uma plataforma que cumpre o seu propósito para que o seu evento
              cumpra o dele.
            </p>
          </div>
        </section>

        {/* ── Imagens + Formulário ── */}
        <section id="formulario" className="py-12 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">

            {/* Left: collage + copy */}
            <div>
              {/* Image collage */}
              <div className="relative mb-8">
                <div className="grid grid-cols-2 gap-2">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80"
                    alt="Evento"
                    className="rounded-2xl object-cover w-full h-44"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&q=80"
                    alt="Evento"
                    className="rounded-2xl object-cover w-full h-44"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80"
                    alt="Evento"
                    className="rounded-2xl object-cover w-full h-44"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80"
                    alt="Evento"
                    className="rounded-2xl object-cover w-full h-44"
                  />
                </div>
                {/* Badge: inscrições */}
                <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-black text-gray-900 leading-none">127 inscrições</p>
                    <p className="text-[10px] text-gray-400">confirmadas</p>
                  </div>
                </div>
                {/* Badge: receita */}
                <div className="absolute bottom-4 right-4 bg-[#0f3d22] rounded-xl shadow-lg px-3 py-2">
                  <p className="text-xs font-black text-white leading-none">R$ 4.320</p>
                  <p className="text-[10px] text-white/60">arrecadados</p>
                </div>
              </div>

              {/* Copy */}
              <h2 className="text-2xl font-black text-[#0f3d22] mb-3">
                Organize com propósito.
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm mb-5">
                O Tovia nasceu para quem organiza conferências, retiros, cultos e eventos com propósito.
                Uma ferramenta completa, pensada para igrejas, ministérios e instituições que precisam
                de eficiência sem perder o cuidado com as pessoas.
              </p>
              <ul className="space-y-2">
                {[
                  'Inscrições e ingressos online',
                  'Controle financeiro por evento',
                  'Check-in com QR Code',
                  'Relatórios em tempo real',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-gray-700 text-sm">
                    <CheckCircle className="w-4 h-4 text-[#1a7a45] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 sticky top-6">
              {enviado ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Recebemos seu interesse!</h3>
                  <p className="text-gray-500 text-sm">
                    Entraremos em contato em breve com mais informações sobre o Tovia.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Quero conhecer o Tovia</h3>
                  <p className="text-gray-500 text-sm mb-5">Preencha o formulário e entraremos em contato.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome</label>
                      <input name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome completo" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">E-mail</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">WhatsApp</label>
                        <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="(11) 91234-5678" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Instituição</label>
                      <input name="instituicao" value={form.instituicao} onChange={handleChange} placeholder="Igreja, ministério, empresa..." className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo de evento que organiza</label>
                      <select name="tipo_evento" value={form.tipo_evento} onChange={handleChange} className={`${inputClass} bg-white`}>
                        <option value="">Selecione...</option>
                        {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Público estimado</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TAMANHOS.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, tamanho_publico: t.value }))}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              form.tamanho_publico === t.value
                                ? 'bg-[#1a7a45] text-white border-[#1a7a45]'
                                : 'border-gray-200 text-gray-600 hover:border-[#1a7a45] hover:text-[#1a7a45]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <input
                        id="lgpd"
                        type="checkbox"
                        checked={lgpdConsent}
                        onChange={e => setLgpdConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#1a7a45] cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="lgpd" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                        Autorizo o Tovia a usar meus dados para entrar em contato sobre a plataforma.
                        Seus dados não serão compartilhados com terceiros.{' '}
                        <a href="/privacidade" target="_blank" className="text-[#1a7a45] underline hover:text-[#155e36]">
                          Política de Privacidade
                        </a>.
                      </label>
                    </div>

                    {erro && <p className="text-red-500 text-xs">{erro}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1a7a45] hover:bg-[#155e36] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Enviando...' : 'Quero saber mais'}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      Seus dados são protegidos pela{' '}
                      <a href="/privacidade" target="_blank" className="underline hover:text-gray-600">
                        Lei Geral de Proteção de Dados (LGPD)
                      </a>.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0f3d22] text-white/70 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold text-lg">tovia</span>
            <p className="text-xs mt-1">Do zero ao check-in, tudo em um lugar.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 text-sm text-center">
            <a href="mailto:suporte@toviaapp.com.br" className="hover:text-white transition-colors">
              suporte@toviaapp.com.br
            </a>
            <a href="/privacidade" className="hover:text-white transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-white/10 text-xs text-center text-white/40">
          © {new Date().getFullYear()} Tovia. Todos os direitos reservados. · CNPJ (em breve)
        </div>
      </footer>
    </div>
  );
}
