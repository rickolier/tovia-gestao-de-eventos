import { db } from './_firebase.js';

const RATE_WINDOW_MS = 60 * 60 * 1000;

export async function checkRateLimit(prefix: string, key: string, limit: number): Promise<boolean> {
  const ref = db.collection('_rate_limits').doc(`${prefix}_${key}`);
  const snap = await ref.get();
  const now = Date.now();
  if (snap.exists) {
    const data = snap.data()!;
    const requests: number[] = (data.requests || []).filter((t: number) => now - t < RATE_WINDOW_MS);
    if (requests.length >= limit) return false;
    requests.push(now);
    await ref.set({ requests });
  } else {
    await ref.set({ requests: [now] });
  }
  return true;
}
