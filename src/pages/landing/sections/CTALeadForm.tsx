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
  { label: '0 – 100', value: '0-100' },
  { label: '101 – 500', value: '101-500' },
  { label: '500 – 2.000', value: '500-2000' },
  { label: '2.000+', value: '2000+' },
];

function maskWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white';

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
      await addDoc(collection(db, 'leads'), {
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
    <section id="planos" className="py-20 px-6 bg-gradient-to-br from-sidebar via-[#1E0B4B] to-primary/80 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/10" />

      <div className="max-w-4xl mx-auto relative">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Experimente grátis</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-4">
            Quer conhecer o Tovia?
          </h2>
          <p className="text-white/60 text-base max-w-lg mx-auto">
            Preencha o formulário abaixo e receba acesso para testar a plataforma completa. Sem compromisso.
          </p>
        </div>

        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {enviado ? (
            <div className="text-center py-8">
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
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
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
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="lgpd-landing" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    Autorizo o Tovia a usar meus dados para entrar em contato sobre a plataforma.
                    Seus dados não serão compartilhados com terceiros.{' '}
                    <a href="/privacidade" target="_blank" className="text-primary underline">
                      Política de Privacidade
                    </a>.
                  </label>
                </div>

                {erro && <p className="text-red-500 text-xs">{erro}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
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
    </section>
  );
}
