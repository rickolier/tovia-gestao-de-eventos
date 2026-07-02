export const ADMIN_EMAILS = [
  'admin@toviaapp.com.br',
  'suporte@toviaapp.com.br',
] as const;

export type AdminEmail = (typeof ADMIN_EMAILS)[number];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && (ADMIN_EMAILS as readonly string[]).includes(email);
}

// Contas de teste com plano pré-definido
export const TEST_ACCOUNT_PLANS: Record<string, string> = {
  'testepro@toviaapp.com.br': 'pro',
};

export function getTestPlan(email: string | null | undefined): string | null {
  if (!email) return null;
  return TEST_ACCOUNT_PLANS[email] ?? null;
}
