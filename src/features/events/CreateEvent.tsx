import React, { useState } from 'react';
import ImageCropper from '~/components/ImageCropper';
import { useAuth } from '~/context/AuthContext';
import { createDocument, listDocuments } from '~/services/firestore';
import { Email } from '~/services/email';
import { where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, AlertTriangle, ImagePlus, X } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '~/services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getPlanConfig } from '~/utils/plan-limits';
import { Evento } from '~/types';
import { Badge } from '@/components/ui/badge';

export default function CreateEvent() {
  const { user: usuario, profile: perfil } = useAuth();
  const navegar = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [quantidadeEventosAtivos, setQuantidadeEventosAtivos] = useState<number | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemErro, setImagemErro] = useState<string | null>(null);
  const [uploadProgresso, setUploadProgresso] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const plano = getPlanConfig(perfil?.plano);

  const calcConfig = React.useMemo(() => {
    try {
      const raw = sessionStorage.getItem('tovia_calc_config');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Validate expected shape — reject if tampered
      if (
        typeof parsed !== 'object' || parsed === null ||
        typeof parsed.pixFee !== 'number' ||
        typeof parsed.creditFee !== 'number' ||
        typeof parsed.debitFee !== 'number' ||
        typeof parsed.recurringFee !== 'number' ||
        typeof parsed.maxParticipants !== 'number' ||
        typeof parsed.results !== 'object'
      ) return null;
      return parsed;
    } catch { return null; }
  }, []);

  const [dadosFormulario, setDadosFormulario] = useState({
    nome: '',
    data_inicio_data: '',
    data_inicio_hora: '',
    data_fim_data: '',
    data_fim_hora: '',
    local: '',
    instituicao: '',
    descricao: '',
    vagas_totais: calcConfig?.maxParticipants || 0,
    cor_tema: 'default',
  });

  const CORES_EVENTO = [
    '#7C3AED', // Roxo
    '#10B981', // Verde
    '#FACC15', // Amarelo
    '#EC4899', // Rosa
    '#3B82F6', // Azul
    '#F97316', // Laranja
  ];

  React.useEffect(() => {
    if (usuario) {
      listDocuments<Evento>('eventos', [
        where('criado_por', '==', usuario.uid)
      ]).then(eventos => {
        const ativos = eventos.filter(e => e.ativo);
        setQuantidadeEventosAtivos(ativos.length);
      });
    }
  }, [usuario]);

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImagemErro(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImagemErro('Formato inválido. Use PNG, JPEG ou WebP.');
      return;
    }

    // Abre o cropper em vez de validar dimensão
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const handleCropComplete = (croppedFile: File) => {
    const preview = URL.createObjectURL(croppedFile);
    setImagemFile(croppedFile);
    setImagemPreview(preview);
    setCropSrc(null);
  };

  const uploadImagem = async (eventoId: string): Promise<string> => {
    if (!imagemFile) return '';
    setUploadProgresso(10);
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imagemFile);
    });
    setUploadProgresso(40);
    const fns = getFunctions(app, 'us-central1');
    const uploadCover = httpsCallable<unknown, { downloadUrl: string }>(fns, 'uploadEventCover');
    const result = await uploadCover({ eventoId, imageBase64, contentType: imagemFile.type });
    setUploadProgresso(100);
    return result.data.downloadUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) {
      toast.error('Você precisa estar logado para criar um evento.');
      return;
    }

    // Validações síncronas antes de iniciar o carregamento
    if (!dadosFormulario.data_inicio_data || !dadosFormulario.data_inicio_hora || !dadosFormulario.data_fim_data || !dadosFormulario.data_fim_hora) {
      toast.error('Por favor, preencha as datas e horários do evento.');
      return;
    }

    const dataInicioObjeto = new Date(`${dadosFormulario.data_inicio_data}T${dadosFormulario.data_inicio_hora}`);
    const dataFimObjeto = new Date(`${dadosFormulario.data_fim_data}T${dadosFormulario.data_fim_hora}`);

    if (dataFimObjeto <= dataInicioObjeto) {
      toast.error('A data de término deve ser após a data de início.');
      return;
    }

    if ((quantidadeEventosAtivos ?? 0) >= plano.maxActiveEvents) {
      toast.error(`Seu plano (${plano.name}) permite apenas ${plano.maxActiveEvents} evento(s) ativo(s).`);
      return;
    }

    if (dadosFormulario.vagas_totais > plano.maxAttendeesPerEvent) {
      toast.error(`Seu plano permite no máximo ${plano.maxAttendeesPerEvent} inscritos por evento.`);
      return;
    }

    setCarregando(true);
    try {
      const id = uuidv4();

      const dataInicioISO = dataInicioObjeto.toISOString();
      const dataFimISO = dataFimObjeto.toISOString();

      // Cor: escolhe aleatoriamente entre as disponíveis
      let corFinal = dadosFormulario.cor_tema;
      if (corFinal === 'default') {
        corFinal = CORES_EVENTO[Math.floor(Math.random() * CORES_EVENTO.length)];
      }

      let imagemUrl = '';
      try {
        imagemUrl = await uploadImagem(id);
      } catch (uploadErr) {
        console.warn('Upload de imagem falhou, criando evento sem imagem:', uploadErr);
        toast.warning('Imagem não foi enviada, mas o evento será criado.');
      }

      const dadosEvento = {
        nome: dadosFormulario.nome,
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        local: dadosFormulario.local,
        instituicao: dadosFormulario.instituicao || '',
        descricao: dadosFormulario.descricao || '',
        vagas_totais: Number(dadosFormulario.vagas_totais),
        imagem_url: imagemUrl,
        cor_tema: corFinal,
        criado_por: usuario.uid,
        ativo: true,
        config_pagamento: {
          pix:            { ativo: true, taxa: 0, tipo_taxa: 'porcentagem' },
          debito:         { ativo: true, taxa: calcConfig?.debitFee    ?? 1.99, tipo_taxa: 'porcentagem' },
          cartao_credito: { ativo: true, taxa: calcConfig?.creditFee   ?? 3.99, tipo_taxa: 'porcentagem', parcelas_max: 12 },
          corrente:       { ativo: true, taxa: calcConfig?.recurringFee ?? 4.99, tipo_taxa: 'porcentagem' },
          boleto:         { ativo: true, taxa: calcConfig?.boletoFee   ?? 2.99, tipo_taxa: 'porcentagem' },
          parcelamento_limite_data: true,
          installmentLogic: 'free',
        },
        config_comunicacao: {
          email_confirmacao: {
            assunto: `Inscrição Confirmada - ${dadosFormulario.nome}`,
            corpo: 'Olá, sua inscrição foi confirmada com sucesso!',
            ativo: true
          },
          lembrete_evento: {
            dias_antes: 2,
            assunto: `Lembrete: ${dadosFormulario.nome} está chegando!`,
            corpo: 'Olá, este é um lembrete de que o evento começará em breve.',
            ativo: true
          }
        },
        campos_customizados: [],
        valor_ticket_projeccao: calcConfig
          ? ((calcConfig.results.costPerPersonMin + calcConfig.results.costPerPersonMax) / 2 || calcConfig.results.costPerPersonMax || calcConfig.results.costPerPersonMin) + calcConfig.results.marginAmountPerPerson
          : 0,
        custo_estimado_por_pessoa: calcConfig
          ? (calcConfig.results.costPerPersonMin + calcConfig.results.costPerPersonMax) / 2 || calcConfig.results.costPerPersonMax || calcConfig.results.costPerPersonMin
          : 0,
      };

      await createDocument('eventos', id, dadosEvento);

      // E-mail: primeiro evento
      const eventosAnteriores = await listDocuments<Evento>('eventos', [where('criado_por', '==', usuario.uid)]);
      if (eventosAnteriores.length <= 1 && usuario.email && perfil?.nome) {
        Email.primeiroEvento(usuario.email, perfil.nome, dadosFormulario.nome);
      }

      if (calcConfig) {
        sessionStorage.removeItem('tovia_calc_config');
        toast.success('Evento criado com as configurações da calculadora!');
      } else {
        toast.success('Evento criado com sucesso!');
      }
      navegar(`/eventos/${id}`);
    } catch (erro: any) {
      console.error('Error creating event:', erro);
      let mensagemErro = 'Erro ao criar evento.';
      
      try {
        const erroValidado = JSON.parse(erro.message);
        if (erroValidado.error === 'Missing or insufficient permissions.') {
          mensagemErro = 'Erro de permissão: Verifique se todos os campos estão preenchidos corretamente.';
        }
      } catch (ex) {
        // Não é um erro JSON
      }
      
      toast.error(mensagemErro);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={16 / 9}
          outputWidth={1280}
          outputHeight={720}
          label="Recortar capa do evento (16:9)"
          onComplete={handleCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}
      {/* Sticky top header */}
      <header className="sticky top-0 z-30 bg-[var(--sidebar)] h-14 flex items-center px-4 gap-3">
        <Link to="/dashboard" className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-semibold text-white flex-1">Novo Evento</h1>
        <Badge variant="outline" className="text-xs font-semibold text-white/70 border-white/20 rounded-lg">
          Plano {plano.name}
        </Badge>
      </header>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
        {/* Aviso de limite de eventos */}
        {quantidadeEventosAtivos !== null && quantidadeEventosAtivos >= plano.maxActiveEvents && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-700">Limite de eventos atingido</p>
              <p className="text-xs text-amber-600 mt-0.5">
                O plano <strong>{plano.name}</strong> permite {plano.maxActiveEvents} evento{plano.maxActiveEvents !== 1 ? 's' : ''} ativo{plano.maxActiveEvents !== 1 ? 's' : ''}. Arquive um evento existente ou faça upgrade.
              </p>
            </div>
            <Link to="/plans" className="shrink-0 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors">
              Upgrade →
            </Link>
          </div>
        )}

        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden card-flat">
          <div className="h-1.5 bg-primary" />
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="text-base font-bold text-foreground">Informações do Evento</CardTitle>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo para criar seu evento.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Evento</Label>
                  <Input 
                    id="nome" 
                    required 
                    maxLength={200}
                    value={dadosFormulario.nome}
                    onChange={e => setDadosFormulario({...dadosFormulario, nome: e.target.value})}
                    placeholder="Ex: Conferência Anual 2024"
                    className="rounded-xl border-border focus:ring-primary focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground pl-1">{dadosFormulario.nome.length}/200</p>
                </div>

                {/* Início */}
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      required
                      value={dadosFormulario.data_inicio_data}
                      onChange={e => setDadosFormulario({...dadosFormulario, data_inicio_data: e.target.value})}
                      className="rounded-xl border-border"
                    />
                    <Input
                      type="time"
                      required
                      value={dadosFormulario.data_inicio_hora}
                      onChange={e => setDadosFormulario({...dadosFormulario, data_inicio_hora: e.target.value})}
                      className="rounded-xl border-border"
                    />
                  </div>
                </div>

                {/* Término */}
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      required
                      value={dadosFormulario.data_fim_data}
                      onChange={e => setDadosFormulario({...dadosFormulario, data_fim_data: e.target.value})}
                      className="rounded-xl border-border"
                    />
                    <Input
                      type="time"
                      required
                      value={dadosFormulario.data_fim_hora}
                      onChange={e => setDadosFormulario({...dadosFormulario, data_fim_hora: e.target.value})}
                      className="rounded-xl border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input 
                    id="local" 
                    required 
                    value={dadosFormulario.local}
                    onChange={e => setDadosFormulario({...dadosFormulario, local: e.target.value})}
                    placeholder="Ex: Auditório Central ou Online"
                    className="rounded-xl border-border"
                  />
                </div>

                {/* Imagem do evento */}
                <div className="space-y-2">
                  <Label>Imagem de Capa do Evento</Label>
                  <p className="text-xs text-muted-foreground -mt-1">PNG ou JPEG · mínimo 1920×1080px</p>

                  {!imagemPreview ? (
                    <label
                      htmlFor="imagem_upload"
                      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Clique para anexar a imagem</p>
                        <p className="text-xs text-muted-foreground mt-0.5">PNG ou JPEG, mínimo 1920×1080px</p>
                      </div>
                      <input
                        id="imagem_upload"
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleImagemChange}
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                      <img
                        src={imagemPreview}
                        alt="Preview da capa"
                        className="w-full object-cover"
                        style={{ aspectRatio: '16/9', objectPosition: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setImagemFile(null); setImagemPreview(null); setImagemErro(null); setUploadProgresso(null); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1.5">
                        <p className="text-white text-xs font-medium truncate">{imagemFile?.name}</p>
                      </div>
                    </div>
                  )}

                  {uploadProgresso !== null && uploadProgresso < 100 && (
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-200"
                        style={{ width: `${uploadProgresso}%` }}
                      />
                    </div>
                  )}

                  {imagemErro && (
                    <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {imagemErro}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <Label htmlFor="cor_tema">Cor do Tema (Identidade Visual)</Label>
                  <div className="flex flex-wrap gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => setDadosFormulario({...dadosFormulario, cor_tema: 'default'})}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${dadosFormulario.cor_tema === 'default' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                    >
                      Aleatória/Vibrante
                    </button>
                    {CORES_EVENTO.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setDadosFormulario({...dadosFormulario, cor_tema: color})}
                        className={`w-10 h-10 rounded-xl border-2 transition-all ${dadosFormulario.cor_tema === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-4 items-center">
                    <Input 
                      id="cor_tema" 
                      type="color"
                      value={dadosFormulario.cor_tema === 'default' ? '#000000' : dadosFormulario.cor_tema}
                      disabled={dadosFormulario.cor_tema === 'default'}
                      onChange={e => setDadosFormulario({...dadosFormulario, cor_tema: e.target.value})}
                      className="w-20 h-10 p-1 rounded-lg cursor-pointer disabled:opacity-30"
                    />
                    <Input 
                      type="text"
                      value={dadosFormulario.cor_tema}
                      onChange={e => setDadosFormulario({...dadosFormulario, cor_tema: e.target.value})}
                      className="rounded-xl border-border"
                      placeholder="#064e3b"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Esta cor será usada no cabeçalho do card e nas páginas internas do evento.</p>
                </div>

<div className="space-y-2">
                  <Label htmlFor="descricao">Descrição do Evento</Label>
                  <Textarea 
                    id="descricao"
                    value={dadosFormulario.descricao}
                    onChange={e => setDadosFormulario({...dadosFormulario, descricao: e.target.value})}
                    placeholder="Descreva os detalhes do seu evento..."
                    maxLength={2500}
                    className="rounded-xl border-border min-h-[120px]"
                  />
                  <p className="text-[10px] text-muted-foreground pl-1">{dadosFormulario.descricao.length}/2500</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vagas_totais">Vagas Totais (Máx: {plano.maxAttendeesPerEvent})</Label>
                    <Input 
                      id="vagas_totais" 
                      type="number" 
                      required 
                      max={plano.maxAttendeesPerEvent}
                      value={dadosFormulario.vagas_totais}
                      onChange={e => setDadosFormulario({...dadosFormulario, vagas_totais: Number(e.target.value)})}
                      className={`rounded-xl border-border ${dadosFormulario.vagas_totais > plano.maxAttendeesPerEvent ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {dadosFormulario.vagas_totais > plano.maxAttendeesPerEvent && (
                      <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Seu plano limita este campo a {plano.maxAttendeesPerEvent}
                      </p>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={carregando}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl gap-2 shadow-lg transition-all active:scale-95"
                >
                  {carregando ? 'Criando...' : (
                    <>
                      <Save className="w-5 h-5" />
                      Criar Evento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
