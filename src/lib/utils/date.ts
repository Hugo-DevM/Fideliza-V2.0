/**
 * Timezone-aware date formatting utilities.
 * All functions accept an IANA timezone string (e.g. 'America/Mexico_City').
 * Server components: pass settings.timezone directly.
 * Client components: use useDashboardI18n().timezone from the context.
 */

/** "14 jun. 2025, 10:32" — full timestamp for transaction lists */
export function formatDateTime(iso: string, timezone: string, locale = 'es'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: timezone,
  });
}

/** "14 jun. 2025" — date only, no time */
export function formatDateOnly(iso: string, timezone: string, locale = 'es'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: timezone,
  });
}

/** "10:32" — time only */
export function formatTimeOnly(iso: string, timezone: string, locale = 'es'): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit',
    timeZone: timezone,
  });
}

/**
 * Relative display used in customer detail transactions:
 * "Ahora" / "Hace 5 min" / "Hoy · 10:32" / "Ayer · 10:32" / "14 jun."
 */
export function formatRelative(iso: string, timezone: string, locale = 'es'): string {
  const date = new Date(iso);
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);

  if (mins < 1)  return locale === 'en' ? 'Just now'      : 'Ahora';
  if (mins < 60) return locale === 'en' ? `${mins}m ago`  : `Hace ${mins} min`;

  const hrs     = Math.floor(mins / 60);
  const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: timezone });

  if (hrs < 24)  return locale === 'en' ? `Today · ${timeStr}`     : `Hoy · ${timeStr}`;
  if (hrs < 48)  return locale === 'en' ? `Yesterday · ${timeStr}` : `Ayer · ${timeStr}`;
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: timezone });
}
