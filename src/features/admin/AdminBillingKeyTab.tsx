import React, { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ShieldX, ShieldQuestion } from 'lucide-react';
import { getDocument, updateDocument, createDocument } from '~/services/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';

const CONFIG_COLLECTION = 'config';
const CONFIG_DOC_ID = 'billing';

interface BillingConfig {
  asaas_api_key: string;
  sandbox: boolean;
  updated_at: string;
  updated_by: string;
  is_valid?: boolean;
  last_validated_at?: string;
}

function maskKey(key: string): string {
  if (!key || key.length < 12) return key;
  return key.slice(0, 6) + '•'.repeat(key.length - 10) + key.slice(-4);
}

function StatusBadge({ config, validating }: { config: BillingConfig | null; validating: boolean }) {
  if (validating) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Verificando…
      </span>
    );
  }
  if (!config?.asaas_api_key) return null;
  if (config.is_valid === true) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        Chave válida
      </span>
    );
  }
  if (config.is_valid === false) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <ShieldX className="w-3.5 h-3.5" />
        Chave inválida
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
      <ShieldQuestion className="w-3.5 h-3.5" />
      Não verificada
    </span>
  );
}

export default function AdminBillingKeyTab() {
  const [config, setConfig]             = useState<BillingConfig | null>(null);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);
  const [draftKey, setDraftKey]         = useState('');
  const [draftSandbox, setDraftSandbox] = useState(true);
  const [showKey, setShowKey]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [validating, setValidating]     = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const doc = await getDocument<BillingConfig>(CONFIG_COLLECTION, CONFIG_DOC_ID);
      setConfig(doc ?? null);
      if (doc) {
        setDraftKey(doc.asaas_api_key ?? '');
        setDraftSandbox(doc.sandbox ?? true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!draftKey.trim()) return;
    setSaving(true);
    try {
      const data: Omit<BillingConfig, 'is_valid' | 'last_validated_at'> = {
        asaas_api_key: draftKey.trim(),
        sandbox: draftSandbox,
        updated_at: new Date().toISOString(),
        updated_by: 'admin',
      };
      if (config) {
        await updateDocument(CONFIG_COLLECTION, CONFIG_DOC_ID, data);
      } else {
        await createDocument(CONFIG_COLLECTION, CONFIG_DOC_ID, data);
      }
      setConfig(data);
      setEditing(false);
      setShowKey(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Verifica automaticamente após salvar
      await handleValidate(data);
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(currentConfig?: BillingConfig) {
    setValidating(true);
    setValidateError(null);
    try {
      const fns = getFunctions(app, 'us-central1');
      const validate = httpsCallable<object, { valid: boolean; sandbox?: boolean; baseUrl?: string; debugInfo?: string }>(fns, 'validateBillingKey');
      const result = await validate({});
      const updated = { ...(currentConfig ?? config)!, is_valid: result.data.valid, last_validated_at: new Date().toISOString() };
      setConfig(updated);
      if (!result.data.valid) {
        setValidateError(`Sandbox=${result.data.sandbox} | URL=${result.data.baseUrl} | ${result.data.debugInfo}`);
      }
    } catch (e: any) {
      setValidateError(e?.message ?? 'Erro ao verificar a chave.');
    } finally {
      setValidating(false);
    }
  }

  function handleEdit() {
    setDraftKey(config?.asaas_api_key ?? '');
    setDraftSandbox(config?.sandbox ?? true);
    setEditing(true);
    setShowKey(true);
    setValidateError(null);
  }

  function handleCancel() {
    setEditing(false);
    setShowKey(false);
    setValidateError(null);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando configuração…</span>
      </div>
    );
  }

  const currentKey = config?.asaas_api_key ?? '';
  const isSandbox  = editing ? draftSandbox : (config?.sandbox ?? true);

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header info */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5 flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Chave API Asaas — Plataforma Tovia</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Esta chave é usada pelo Tovia para cobrar os planos dos organizadores (Pétach, Koách, Chalém).
            É diferente da chave que cada organizador conecta na própria conta para receber pagamentos dos participantes.
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">

        {/* Status row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
              isSandbox
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {isSandbox ? 'Sandbox' : 'Produção'}
            </span>
            <StatusBadge config={config} validating={validating} />
          </div>
          {currentKey && !editing && (
            <button
              onClick={() => handleValidate()}
              disabled={validating}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              Verificar novamente
            </button>
          )}
        </div>

        {config?.last_validated_at && !editing && (
          <p className="text-[11px] text-muted-foreground -mt-2">
            Última verificação: {new Date(config.last_validated_at).toLocaleString('pt-BR')}
          </p>
        )}

        {/* Key display / edit */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Chave API
          </label>

          {editing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraftSandbox(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    draftSandbox
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSandbox(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    !draftSandbox
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  Produção
                </button>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={draftKey}
                  onChange={e => setDraftKey(e.target.value)}
                  placeholder="$aact_..."
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 pr-12 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {currentKey ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
                  <span className="font-mono text-sm text-foreground tracking-wide flex-1 min-w-0 truncate">
                    {showKey ? currentKey : maskKey(currentKey)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Nenhuma chave configurada
                </div>
              )}
            </div>
          )}
        </div>

        {config?.updated_at && !editing && (
          <p className="text-[11px] text-muted-foreground">
            Última atualização: {new Date(config.updated_at).toLocaleString('pt-BR')}
          </p>
        )}

        {/* Feedback */}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Chave salva. Verificando conexão…
          </div>
        )}
        {validateError && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {validateError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={!draftKey.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar e verificar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              {currentKey ? 'Alterar chave' : 'Configurar chave'}
            </button>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 leading-relaxed">
          <strong>Atenção:</strong> A chave fica armazenada no Firestore com acesso restrito ao admin.
          Para produção, prefira mover segredos para variáveis de ambiente de um backend.
          Nunca compartilhe a chave de produção.
        </div>
      </div>

    </div>
  );
}
