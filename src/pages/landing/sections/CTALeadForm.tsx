import React, { useState } from 'react';
import { addDocument } from '~/services/firestore';
import { CheckCircle, Loader2, Sparkles, Users, Calendar, Shield } from 'lucide-react';

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
  { label: '0 – 100', value: '0-100' },
  { label: '101 – 500', value: '101-500' },
  { label: '500 – 2.000', value: '500-2000' },
  { label: '2.000+', value: '2000+' },
];

const BENEFICIOS = [
  { icon: Sparkles, text: 'Acesso completo à plataforma' },
  { icon: Users, text: 'Gestão ilimitada de participantes' },
  { icon: Calendar, text: 'Crie seu primeiro evento em minutos' },
  { icon: Shield, text: 'Sem compromisso, cancele quando quiser' },
];

function maskWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const inputClass =
  'w-full border border-orange-200/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E0B4B] focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400';

export function CTALeadForm() {
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErro('Digite um e-mail válido.');
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await addDocument('leads', {
        ...form,
        lgpd_consent: true,
        lgpd_consent_em: new Date().toISOString(),
        criado_em: new Date().toISOString(),
        origem: 'landing_site',
      });
      setEnviado(true);
    } catch {
      setErro('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="planos" className="py-20 px-6 bg-primary relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#FF8C47]/30" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#1E0B4B]/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5" />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Lado esquerdo — texto */}
          <div className="text-white">
            <span className="inline-block text-xs font-black uppercase tracking-[0.25em] bg-[#1E0B4B] text-white px-4 py-1.5 rounded-full mb-6">
              Experimente grátis
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-5 uppercase">
              Quer conhecer<br />o Tovia?
            </h2>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-md">
              Preencha o formulário e receba acesso para testar a plataforma completa. Sem compromisso, sem cartão de crédito.
            </p>

            <div className="space-y-4">
              {BENEFICIOS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E0B4B]/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-semibold">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-[#1E0B4B]/20">
              <p className="text-[#1E0B4B]/70 text-xs uppercase tracking-widest font-bold mb-3">Ideal para</p>
              <div className="flex flex-wrap gap-2">
                {['Igrejas', 'Ministérios', 'ONGs', 'Escolas', 'Comunidades'].map(tag => (
                  <span key={tag} className="text-xs font-bold text-white bg-[#1E0B4B]/25 px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lado direito — formulário */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 p-7 md:p-8 border border-white/50">
            {enviado ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Recebemos seu interesse!</h3>
                <p className="text-gray-500 text-sm">
                  Entraremos em contato em breve com mais informações sobre o Tovia.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-black text-gray-900 mb-1">Quero conhecer o Tovia</h3>
                <p className="text-gray-500 text-sm mb-6">Preencha e entraremos em contato.</p>
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
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo de evento</label>
                    <select name="tipo_evento" value={form.tipo_evento} onChange={handleChange} className={`${inputClass} bg-white`}>
                      <option value="">Selecione...</option>
                      {TIPOS_EVENTO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Público estimado</label>
                    <div className="grid grid-cols-4 gap-2">
                      {TAMANHOS.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, tamanho_publico: t.value }))}
                          className={`px-2 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            form.tamanho_publico === t.value
                              ? 'bg-[#1E0B4B] text-white border-[#1E0B4B]'
                              : 'border-gray-200 text-gray-600 hover:border-[#1E0B4B] hover:text-[#1E0B4B]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <input
                      id="lgpd-landing"
                      type="checkbox"
                      checked={lgpdConsent}
                      onChange={e => setLgpdConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#1E0B4B] cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="lgpd-landing" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                      Autorizo o Tovia a usar meus dados para entrar em contato sobre a plataforma.
                      Seus dados não serão compartilhados com terceiros.{' '}
                      <a href="/privacidade" target="_blank" className="text-[#1E0B4B] underline font-semibold">
                        Política de Privacidade
                      </a>.
                    </label>
                  </div>

                  {erro && <p className="text-red-500 text-xs">{erro}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1E0B4B] hover:bg-[#2D1470] text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-[#1E0B4B]/20"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Enviando...' : 'Quero conhecer o Tovia'}
                  </button>

                  <p className="text-center text-[10px] text-gray-400">
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
      </div>
    </section>
  );
}
