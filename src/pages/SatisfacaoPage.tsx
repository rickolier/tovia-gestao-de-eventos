import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '~/services/firebase';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Phase = 'loading' | 'form' | 'already' | 'done' | 'error';

export default function SatisfacaoPage() {
  const [params] = useSearchParams();
  const ticketId = params.get('ticket') || '';

  const [phase, setPhase]       = useState<Phase>('loading');
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving]     = useState(false);
  const [titulo, setTitulo]     = useState('');

  useEffect(() => {
    if (!ticketId) { setPhase('error'); return; }
    (async () => {
      try {
        const avaliacaoRef = doc(db, 'ticket_avaliacoes', ticketId);
        const avaliacaoSnap = await getDoc(avaliacaoRef);
        if (avaliacaoSnap.exists()) { setPhase('already'); return; }

        const ticketSnap = await getDoc(doc(db, 'tickets', ticketId));
        if (ticketSnap.exists()) setTitulo(ticketSnap.data()?.titulo || '');

        setPhase('form');
      } catch {
        setPhase('error');
      }
    })();
  }, [ticketId]);

  const handleSubmit = async () => {
    if (!rating) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'ticket_avaliacoes', ticketId), {
        ticketId,
        nota: rating,
        comentario: comentario.trim() || null,
        criado_em: new Date().toISOString(),
      });
      setPhase('done');
    } catch {
      setSaving(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];
  const LABELS = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <div className="min-h-screen bg-[#f4f6f3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-[#1a7a45] rounded-t-2xl px-8 py-6 text-center">
          <span className="text-3xl font-black text-white tracking-tight">tovia</span>
          <span className="block text-[10px] font-semibold text-[#a7f3d0] tracking-[3px] mt-1">GESTÃO DE EVENTOS</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-b-2xl px-8 py-8 shadow-sm">
          {phase === 'loading' && (
            <p className="text-center text-muted-foreground text-sm">Carregando...</p>
          )}

          {phase === 'error' && (
            <div className="text-center">
              <p className="text-lg font-bold text-foreground mb-2">Link inválido</p>
              <p className="text-sm text-muted-foreground">Este link de avaliação não é válido ou expirou.</p>
            </div>
          )}

          {phase === 'already' && (
            <div className="text-center">
              <div className="text-4xl mb-4">🙏</div>
              <p className="text-lg font-bold text-foreground mb-2">Avaliação já registrada</p>
              <p className="text-sm text-muted-foreground">Você já avaliou este atendimento. Obrigado pelo feedback!</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-lg font-bold text-foreground mb-2">Obrigado pelo feedback!</p>
              <p className="text-sm text-muted-foreground">Sua avaliação foi registrada e vai nos ajudar a melhorar o suporte.</p>
            </div>
          )}

          {phase === 'form' && (
            <div>
              <h1 className="text-xl font-black text-foreground mb-1">Como foi o atendimento?</h1>
              {titulo && (
                <p className="text-sm text-muted-foreground mb-6">Ticket: <strong className="text-foreground">{titulo}</strong></p>
              )}

              {/* Star rating */}
              <div className="flex gap-2 justify-center mb-2">
                {stars.map(s => (
                  <button
                    key={s}
                    type="button"
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(s)}
                  >
                    <Star
                      className="w-9 h-9 transition-colors"
                      fill={(hovered || rating) >= s ? '#f59e0b' : 'none'}
                      stroke={(hovered || rating) >= s ? '#f59e0b' : '#d1d5db'}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-semibold text-amber-600 mb-6 h-5">
                {LABELS[hovered || rating]}
              </p>

              <Textarea
                placeholder="Comentário opcional — o que podemos melhorar?"
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                className="mb-4 resize-none"
                rows={3}
              />

              <Button
                className="w-full"
                disabled={!rating || saving}
                onClick={handleSubmit}
              >
                {saving ? 'Enviando...' : 'Enviar avaliação'}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Tovia Gestão de Eventos
        </p>
      </div>
    </div>
  );
}
