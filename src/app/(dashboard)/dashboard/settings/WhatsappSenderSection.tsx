export default function WhatsappSenderSection({
  currentFrom,
}: {
  currentFrom: string | null;
  plan: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <WhatsAppIcon className="h-4 w-4 text-green-500 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                Número de WhatsApp Business
              </h2>
              <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Próximamente
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Los mensajes a tus clientes se envían desde el número oficial de Fideliza.
            </p>
          </div>
        </div>
      </div>

      {/* Current sender */}
      <div className="rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-4 py-3 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full shrink-0 bg-green-500" />
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {currentFrom
            ? <>Enviando desde <span className="font-mono font-semibold">{currentFrom.replace('whatsapp:', '')}</span></>
            : 'Enviando desde el número oficial de Fideliza'}
        </p>
      </div>

      {/* Coming soon */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3">
        <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <span className="font-semibold">Próximamente:</span> podrás conectar tu propio número de WhatsApp Business para que los mensajes salgan a nombre de tu negocio. Te avisaremos cuando esté disponible.
        </p>
      </div>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
