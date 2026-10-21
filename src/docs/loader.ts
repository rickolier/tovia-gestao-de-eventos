const loaders: Record<string, () => Promise<string>> = {
  '/docs/documento-produto.html': () => import('./documento-produto.html?raw').then(m => m.default),
  '/docs/codigos-erro.html': () => import('./codigos-erro.html?raw').then(m => m.default),
  '/docs/tovia-design-system.html': () => import('./tovia-design-system.html?raw').then(m => m.default),
  '/docs/tovia-mobile-spec.html': () => import('./tovia-mobile-spec.html?raw').then(m => m.default),
  '/docs/arquitetura-tovia.html': () => import('./arquitetura-tovia.html?raw').then(m => m.default),
  '/docs/marketing-gtm-tovia.html': () => import('./marketing-gtm-tovia.html?raw').then(m => m.default),
  '/docs/kpis-tovia.html': () => import('./kpis-tovia.html?raw').then(m => m.default),
  '/docs/backlog-tovia.html': () => import('./backlog-tovia.html?raw').then(m => m.default),
  '/docs/brandguide-checklist.html': () => import('./brandguide-checklist.html?raw').then(m => m.default),
};

export async function loadDocHtml(path: string): Promise<string | null> {
  const loader = loaders[path];
  if (!loader) return null;
  return loader();
}
