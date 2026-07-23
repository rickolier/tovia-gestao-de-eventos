import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, verifyAuth } from './_firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import type { AuthError } from './_types.js';
import { equipeJoinSchema } from './_schemas.js';
import { validateBody } from './_validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = validateBody(req.body, res, equipeJoinSchema);
  if (!body) return;
  const { eventoId } = body;

  let decoded: Awaited<ReturnType<typeof verifyAuth>>;
  try {
    decoded = await verifyAuth(req.headers.authorization);
  } catch (e: unknown) {
    const authErr = e as AuthError;
    return res.status(authErr.status ?? 401).json({ error: authErr.message });
  }

  const uid: string = decoded.uid;
  const email: string = decoded.email || '';
  const name: string = decoded.name || email;

  if (!email) {
    return res.status(403).json({ error: 'Operação não permitida.' });
  }

  try {
    const eventoRef = db.collection('eventos').doc(eventoId);
    const eventoSnap = await eventoRef.get();

    if (!eventoSnap.exists) {
      return res.status(404).json({ error: 'Evento não encontrado.', eventoId });
    }

    const evento = eventoSnap.data() || {};
    const equipeAtual: Array<{ userId: string }> = evento.equipe || [];

    if (equipeAtual.some((m) => m.userId === uid)) {
      return res.json({ ok: true, alreadyMember: true });
    }

    const conviteSnap = await db.collection('convites')
      .where('eventoId', '==', eventoId)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (conviteSnap.empty) {
      return res.status(403).json({ error: 'Nenhum convite encontrado para este e-mail neste evento.' });
    }

    const conviteDoc = conviteSnap.docs[0];
    const permissoes: string[] = conviteDoc.data().permissoes || ['registrations', 'management', 'rooms', 'tasks'];

    const membro = {
      userId: uid,
      email: email.toLowerCase(),
      nome: name,
      permissoes,
      adicionadoEm: new Date().toISOString(),
    };

    await eventoRef.update({
      equipe: FieldValue.arrayUnion(membro),
      equipeIds: FieldValue.arrayUnion(uid),
    });

    await conviteDoc.ref.delete();

    if (evento.criado_por) {
      const notifId = `eq_${eventoId}_${uid}`;
      const notifRef = db.collection('notificacoes').doc(notifId);
      const notifSnap = await notifRef.get();
      if (!notifSnap.exists) {
        await notifRef.set({
          id: notifId,
          userId: evento.criado_por,
          eventoId,
          tipo: 'equipe_novo_membro',
          titulo: 'Novo membro entrou na equipe',
          mensagem: `${name} entrou na equipe do evento "${evento.nome || eventoId}" via link de convite.`,
          data: new Date().toISOString(),
          lida: false,
          acao_requirida: false,
          dados_acao: { membroEmail: email, membroNome: name, membroId: uid },
        });
      }
    }

    console.log('[equipeJoin] sucesso');
    return res.json({ ok: true });

  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    console.error('[equipeJoin] erro:', err?.message, err?.code);
    return res.status(500).json({ error: err?.message || 'Erro interno.', code: err?.code });
  }
}
