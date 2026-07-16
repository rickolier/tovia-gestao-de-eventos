/*
  Design System — Central Tovia Admin
  O conteúdo é o próprio documento HTML do design system (public/design-system.html),
  mantido em sincronia com o artifact publicado. Renderizado em iframe para
  fidelidade total de estilos, sem colisão com o CSS/Tailwind do app.
*/
export default function DesignSystemTab() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-white -mx-1">
      <iframe
        src="/design-system.html"
        title="Tovia — Design System"
        className="w-full border-0 block"
        style={{ height: 'calc(100vh - 220px)', minHeight: 600 }}
      />
    </div>
  );
}
