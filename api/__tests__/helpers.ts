import type { VercelRequest, VercelResponse } from '@vercel/node';
import { vi } from 'vitest';

// ── In-memory Firestore mock ─────────────────────────────────────────────────

type DocData = Record<string, any>;

const store: Record<string, DocData> = {};

function docPath(collection: string, id: string) {
  return `${collection}/${id}`;
}

function mockDoc(collection: string, id: string) {
  const path = docPath(collection, id);
  return {
    get: vi.fn(async () => {
      const data = store[path];
      return {
        exists: !!data,
        data: () => data ? { ...data } : undefined,
        id,
      };
    }),
    set: vi.fn(async (data: DocData, opts?: { merge?: boolean }) => {
      if (opts?.merge) {
        store[path] = { ...(store[path] || {}), ...data };
      } else {
        store[path] = { ...data };
      }
    }),
    update: vi.fn(async (data: DocData) => {
      store[path] = { ...(store[path] || {}), ...data };
    }),
    delete: vi.fn(async () => {
      delete store[path];
    }),
  };
}

function mockCollection(name: string) {
  return {
    doc: (id: string) => mockDoc(name, id),
  };
}

export const mockDb = {
  collection: vi.fn((name: string) => mockCollection(name)),
};

export function seedDoc(collection: string, id: string, data: DocData) {
  store[docPath(collection, id)] = { ...data };
}

export function getDoc(collection: string, id: string): DocData | undefined {
  return store[docPath(collection, id)];
}

export function clearStore() {
  for (const key of Object.keys(store)) delete store[key];
}

// ── Mock verifyAuth ──────────────────────────────────────────────────────────

export const mockVerifyAuth = vi.fn(async (authHeader: string | undefined, expectedUid?: string) => {
  if (!authHeader?.startsWith('Bearer ')) {
    const err: any = new Error('Não autenticado.');
    err.status = 401;
    throw err;
  }
  const uid = authHeader.slice(7);
  if (expectedUid && uid !== expectedUid) {
    const err: any = new Error('UID mismatch.');
    err.status = 403;
    throw err;
  }
  return { uid };
});

// ── Mock fetch (for Resend emails) ───────────────────────────────────────────

export const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }));

// ── Mock VercelRequest / VercelResponse ──────────────────────────────────────

export function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {},
    body: {},
    query: {},
    ...overrides,
  } as unknown as VercelRequest;
}

export function createMockRes(): VercelResponse & { _status: number; _body: any } {
  const res: any = {
    _status: 200,
    _body: null,
  };
  res.status = vi.fn((code: number) => {
    res._status = code;
    return res;
  });
  res.json = vi.fn((data: any) => {
    res._body = data;
    return res;
  });
  res.send = vi.fn((data: any) => {
    res._body = data;
    return res;
  });
  return res;
}
