'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Pestañas del panel, mismo control segmentado que el detalle de programa.
 *
 * Los dos paneles llegan ya renderizados en el servidor como children: este
 * componente solo decide cuál se ve. Por eso cambiar de pestaña es instantáneo
 * y no vuelve a pegarle a la base — a cambio de mandar el HTML de ambos, que
 * con 25 negocios y 200 tickets no pesa nada.
 */
export default function AdminTabs({
  initialTab,
  openTickets,
  negocios,
  tickets,
}: {
  initialTab:  string;
  openTickets: number;
  negocios:    React.ReactNode;
  tickets:     React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(initialTab === 'tickets' ? 'tickets' : 'negocios');
  const [visible,   setVisible]   = useState(true);
  const pendingTab = useRef<string | null>(null);

  function switchTab(tab: string) {
    if (tab === activeTab) return;
    pendingTab.current = tab;
    setVisible(false);
  }

  useEffect(() => {
    if (!visible && pendingTab.current) {
      const t = setTimeout(() => {
        setActiveTab(pendingTab.current!);
        pendingTab.current = null;
        setVisible(true);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <>
      <div className="flex gap-1 rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-1">
        <TabButton active={activeTab === 'negocios'} onClick={() => switchTab('negocios')}>
          Negocios
        </TabButton>
        <TabButton active={activeTab === 'tickets'} onClick={() => switchTab('tickets')}>
          Tickets
          {/* La insignia se ve desde la pestaña de negocios: sacar los tickets
              de la vista principal sin esto los volvería invisibles. */}
          {openTickets > 0 && (
            <span className="ml-2 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
              {openTickets}
            </span>
          )}
        </TabButton>
      </div>

      <div
        className="space-y-6"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'none' : 'translateY(6px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        {activeTab === 'negocios' ? negocios : tickets}
      </div>
    </>
  );
}

function TabButton({
  active, onClick, children,
}: {
  active:   boolean;
  onClick:  () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium text-center transition-colors ${
        active
          ? 'bg-gray-100 dark:bg-[#1e2438] text-gray-900 dark:text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
