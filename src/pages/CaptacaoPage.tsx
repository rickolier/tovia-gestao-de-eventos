import React, { useState } from 'react';
import { db } from '~/services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { CheckCircle, Loader2 } from 'lucide-react';

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
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a45] focus:border-transparent';

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
      {/* Header */}
      <header className="bg-[#0f3d22] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-white text-2xl font-bold tracking-tight">tovia</span>
          <span className="text-[#4ade80] text-xs font-medium uppercase tracking-widest mt-1">Gestão de Eventos</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="bg-[#0f3d22] text-white pb-16 pt-10 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <span className="inline-block bg-[#4ade80]/20 text-[#4ade80] text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              Em breve
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              A plataforma que vai mudar<br className="hidden md:block" /> a forma de gerir seus eventos
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Do zero ao check-in, tudo em um só lugar. Inscrições, financeiro, equipe e relatórios — simples, rápido e sem complicação.
            </p>
          </div>
        </section>

        {/* Main section: image + form */}
        <section className="py-12 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            {/* Left: image + copy */}
            <div>
              <div className="rounded-2xl overflow-hidden shadow-lg mb-6 aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
                  alt="Evento organizado"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-[#0f3d22] mb-3">
                Organize com propósito.
              </h2>
              <p className="text-gray-600 leading-relaxed">
                O Tovia nasceu para quem organiza conferências, retiros, cultos e eventos com propósito.
                Uma ferramenta completa, pensada para igrejas, ministérios e instituições que precisam
                de eficiência sem perder o cuidado com as pessoas.
              </p>
              <ul className="mt-4 space-y-2">
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
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
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
                  <p className="text-gray-500 text-sm mb-6">Preencha o formulário e entraremos em contato.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome</label>
                      <input name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome completo" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    {/* LGPD consent */}
                    <div className="flex items-start gap-3 pt-1">
                      <input
                        id="lgpd"
                        type="checkbox"
                        checked={lgpdConsent}
                        onChange={e => setLgpdConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1a7a45] accent-[#1a7a45] cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="lgpd" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                        Autorizo o Tovia a usar meus dados (nome, e-mail, WhatsApp e instituição) para entrar em contato sobre a plataforma.
                        Seus dados não serão compartilhados com terceiros e podem ser removidos a qualquer momento.{' '}
                        <a href="/privacidade" target="_blank" className="text-[#1a7a45] underline hover:text-[#155e36]">
                          Política de Privacidade
                        </a>.
                      </label>
                    </div>

                    {erro && <p className="text-red-500 text-xs">{erro}</p>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#1a7a45] hover:bg-[#155e36] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
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

      {/* Footer */}
      <footer className="bg-[#0f3d22] text-white/70 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold text-lg">tovia</span>
            <p className="text-xs mt-1">Do zero ao check-in, tudo em um lugar.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 text-sm text-center">
            <a href="mailto:suporte@toviaapp.com.br" className="hover:text-white transition-colors">
              suporte@toviaapp.com.br
            </a>
            <a href="/privacidade" className="hover:text-white transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-white/10 text-xs text-center text-white/40">
          © {new Date().getFullYear()} Tovia. Todos os direitos reservados. · CNPJ (em breve)
        </div>
      </footer>
    </div>
  );
}
