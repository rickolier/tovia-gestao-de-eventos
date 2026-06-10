import React, { useState } from 'react';
import { Evento, FormField } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Mail, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  FileText,
  Save
} from 'lucide-react';
import { updateDocument } from '../../lib/firebase-utils';
import { toast } from 'sonner';

export default function SettingsTab({ evento }: { evento: Evento }) {
  const [localEvento, setLocalEvento] = useState<Evento>(evento);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('eventos', evento.id, localEvento);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      label: '',
      tipo: 'text',
      obrigatorio: true
    };
    setLocalEvento({
      ...localEvento,
      campos_customizados: [...localEvento.campos_customizados, newField]
    });
  };

  const removeField = (id: string) => {
    setLocalEvento({
      ...localEvento,
      campos_customizados: localEvento.campos_customizados.filter(f => f.id !== id)
    });
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setLocalEvento({
      ...localEvento,
      campos_customizados: localEvento.campos_customizados.map(f => 
        f.id === id ? { ...f, ...updates } : f
      )
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between sticky top-32 z-10 bg-background/80 backdrop-blur-sm py-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Configurações do Evento</h2>
          <p className="text-sm text-muted-foreground">Gerencie pagamentos, comunicações e formulários.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 shadow-lg"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General & Status */}
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Status do Evento
            </CardTitle>
            <CardDescription>Ative ou desative o evento para novas inscrições.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-base">Evento Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  {localEvento.ativo ? 'O evento está visível e aceitando inscrições.' : 'O evento está pausado.'}
                </p>
              </div>
              <Switch 
                checked={localEvento.ativo}
                onCheckedChange={(checked) => setLocalEvento({...localEvento, ativo: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Configurações de Pagamento
            </CardTitle>
            <CardDescription>Configure taxas e métodos de recebimento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PIX */}
            <div className="space-y-4 p-4 border border-border/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">PIX</span>
                </div>
                <Switch 
                  checked={localEvento.config_pagamento.pix.ativo}
                  onCheckedChange={(checked) => setLocalEvento({
                    ...localEvento,
                    config_pagamento: {
                      ...localEvento.config_pagamento,
                      pix: { ...localEvento.config_pagamento.pix, ativo: checked }
                    }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Taxa (%)</Label>
                  <Input 
                    type="number" 
                    value={localEvento.config_pagamento.pix.taxa}
                    onChange={(e) => setLocalEvento({
                      ...localEvento,
                      config_pagamento: {
                        ...localEvento.config_pagamento,
                        pix: { ...localEvento.config_pagamento.pix, taxa: Number(e.target.value) }
                      }
                    })}
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Credit Card */}
            <div className="space-y-4 p-4 border border-border/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">Cartão de Crédito</span>
                </div>
                <Switch 
                  checked={localEvento.config_pagamento.cartao_credito.ativo}
                  onCheckedChange={(checked) => setLocalEvento({
                    ...localEvento,
                    config_pagamento: {
                      ...localEvento.config_pagamento,
                      cartao_credito: { ...localEvento.config_pagamento.cartao_credito, ativo: checked }
                    }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Taxa (%)</Label>
                  <Input 
                    type="number" 
                    value={localEvento.config_pagamento.cartao_credito.taxa}
                    onChange={(e) => setLocalEvento({
                      ...localEvento,
                      config_pagamento: {
                        ...localEvento.config_pagamento,
                        cartao_credito: { ...localEvento.config_pagamento.cartao_credito, taxa: Number(e.target.value) }
                      }
                    })}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Parcelas Máx.</Label>
                  <Input 
                    type="number" 
                    value={localEvento.config_pagamento.cartao_credito.parcelas_max}
                    onChange={(e) => setLocalEvento({
                      ...localEvento,
                      config_pagamento: {
                        ...localEvento.config_pagamento,
                        cartao_credito: { ...localEvento.config_pagamento.cartao_credito, parcelas_max: Number(e.target.value) }
                      }
                    })}
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>Nota: O parcelamento é limitado automaticamente até a data do evento para garantir a quitação.</p>
            </div>
          </CardContent>
        </Card>

        {/* Communication Settings */}
        <Card className="border-none shadow-sm rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Comunicação e E-mails
            </CardTitle>
            <CardDescription>Personalize as mensagens enviadas aos participantes.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confirmation Email */}
            <div className="space-y-4 p-4 border border-border/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">E-mail de Confirmação</span>
                <Switch 
                  checked={localEvento.config_comunicacao.email_confirmacao.ativo}
                  onCheckedChange={(checked) => setLocalEvento({
                    ...localEvento,
                    config_comunicacao: {
                      ...localEvento.config_comunicacao,
                      email_confirmacao: { ...localEvento.config_comunicacao.email_confirmacao, ativo: checked }
                    }
                  })}
                />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Assunto</Label>
                  <Input 
                    value={localEvento.config_comunicacao.email_confirmacao.assunto}
                    onChange={(e) => setLocalEvento({
                      ...localEvento,
                      config_comunicacao: {
                        ...localEvento.config_comunicacao,
                        email_confirmacao: { ...localEvento.config_comunicacao.email_confirmacao, assunto: e.target.value }
                      }
                    })}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensagem Personalizada</Label>
                    <textarea 
                      value={localEvento.config_comunicacao.email_confirmacao.corpo}
                      onChange={(e) => setLocalEvento({
                        ...localEvento,
                        config_comunicacao: {
                          ...localEvento.config_comunicacao,
                          email_confirmacao: { ...localEvento.config_comunicacao.email_confirmacao, corpo: e.target.value }
                        }
                      })}
                      className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-muted/20 text-sm focus:ring-primary focus:border-primary text-foreground"
                    />
                </div>
              </div>
            </div>

            {/* Reminder Email */}
            <div className="space-y-4 p-4 border border-border/50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Lembrete de Evento Próximo</span>
                <Switch 
                  checked={localEvento.config_comunicacao.lembrete_evento.ativo}
                  onCheckedChange={(checked) => setLocalEvento({
                    ...localEvento,
                    config_comunicacao: {
                      ...localEvento.config_comunicacao,
                      lembrete_evento: { ...localEvento.config_comunicacao.lembrete_evento, ativo: checked }
                    }
                  })}
                />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Dias Antes</Label>
                    <Input 
                      type="number"
                      value={localEvento.config_comunicacao.lembrete_evento.dias_antes}
                      onChange={(e) => setLocalEvento({
                        ...localEvento,
                        config_comunicacao: {
                          ...localEvento.config_comunicacao,
                          lembrete_evento: { ...localEvento.config_comunicacao.lembrete_evento, dias_antes: Number(e.target.value) }
                        }
                      })}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Assunto</Label>
                  <Input 
                    value={localEvento.config_comunicacao.lembrete_evento.assunto}
                    onChange={(e) => setLocalEvento({
                      ...localEvento,
                      config_comunicacao: {
                        ...localEvento.config_comunicacao,
                        lembrete_evento: { ...localEvento.config_comunicacao.lembrete_evento, assunto: e.target.value }
                      }
                    })}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensagem</Label>
                  <textarea 
                    value={localEvento.config_comunicacao.lembrete_evento.corpo}
                    onChange={(e) => setLocalEvento({
                      ...localEvento,
                      config_comunicacao: {
                        ...localEvento.config_comunicacao,
                        lembrete_evento: { ...localEvento.config_comunicacao.lembrete_evento, corpo: e.target.value }
                      }
                    })}
                    className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-muted/20 text-sm focus:ring-primary focus:border-primary text-foreground"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Builder */}
        <Card className="border-none shadow-sm rounded-2xl lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Formulário de Inscrição
              </CardTitle>
              <CardDescription>Adicione perguntas personalizadas para os inscritos.</CardDescription>
            </div>
            <Button onClick={addField} variant="outline" size="sm" className="rounded-xl border-primary text-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {localEvento.campos_customizados.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                <p className="text-sm text-muted-foreground">Nenhuma pergunta personalizada adicionada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {localEvento.campos_customizados.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl group">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Pergunta</Label>
                        <Input 
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Ex: Qual sua restrição alimentar?"
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo de Resposta</Label>
                        <select 
                          value={field.tipo}
                          onChange={(e) => updateField(field.id, { tipo: e.target.value as any })}
                          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="select">Múltipla Escolha</option>
                          <option value="checkbox">Caixa de Seleção</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4 pt-6">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={field.obrigatorio}
                            onCheckedChange={(checked) => updateField(field.id, { obrigatorio: checked })}
                          />
                          <span className="text-xs font-medium">Obrigatório</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeField(field.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Participants */}
        <Card className="border-none shadow-sm rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Importar Inscritos
            </CardTitle>
            <CardDescription>Importe uma lista de participantes via CSV ou Excel.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center space-y-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">Clique para selecionar ou arraste o arquivo</p>
                <p className="text-sm text-muted-foreground">Suporta CSV, XLSX ou XLS (Máx. 5MB)</p>
              </div>
              <Button variant="outline" className="rounded-xl">Selecionar Arquivo</Button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl text-blue-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>O arquivo deve conter as colunas: Nome, E-mail e Telefone.</p>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>Inscritos importados serão marcados como "Validado Manualmente".</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
