// Layout pour toutes les pages admin (avec sidebar)
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Sidebar — sera implémentée à l'étape suivante */}
      <aside className="w-[260px] bg-[#111111] border-r border-brand-border flex-shrink-0" />
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header — sera implémenté à l'étape suivante */}
        <header className="h-16 bg-brand-bg border-b border-brand-border flex-shrink-0" />
        
        {/* Contenu scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
