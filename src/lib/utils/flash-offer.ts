/**
 * Oferta Flash — lógica compartida entre el motor de puntos y el portal.
 *
 * La config vive en `reward_programs.config` con las llaves `flash_*`, y la
 * escribe `updateFlashOfferAction`.
 *
 * Este módulo es la ÚNICA fuente de verdad de "¿está activa la ventana?".
 * El portal le promete al cliente un multiplicador y `createTransaction()` se lo
 * aplica: si cada uno calculara la ventana por su lado, el banner anunciaría 2×
 * en horas en que el earn no lo da. Por eso ambos importan de aquí.
 *
 * Nota sobre la zona horaria: se usa un offset fijo de UTC-6 (CST de Ciudad de
 * México) que ignora el horario de verano, igual que siempre. Es un desfase
 * conocido de hasta 1 h durante CDT y aplica por igual al banner y al earn, así
 * que los dos siguen coincidiendo. Arreglarlo bien exige zona horaria por tenant
 * y cambia el comportamiento del motor de puntos — es un cambio aparte.
 */

/** Offset fijo de Ciudad de México (CST). No contempla horario de verano. */
const MEXICO_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;

export interface FlashOffer {
  multiplier: number;
  startHour:  number;
  endHour:    number;
  /** 0 = domingo … 6 = sábado. Vacío = todos los días. */
  days:       number[];
}

/**
 * Normaliza la config del programa. Devuelve `null` cuando la oferta está
 * apagada o mal configurada, para que quien la use no tenga que revalidar.
 */
export function parseFlashOffer(config: Record<string, unknown> | null | undefined): FlashOffer | null {
  if (!config || !config.flash_enabled) return null;

  const startHour = Number(config.flash_start_hour ?? -1);
  const endHour   = Number(config.flash_end_hour   ?? -1);

  // startHour >= endHour incluye las ventanas que cruzan medianoche, que no
  // están soportadas: se descartan en vez de aplicarse al revés.
  if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) return null;
  if (startHour < 0 || endHour < 0 || startHour >= endHour) return null;

  const multiplier = Number(config.flash_multiplier ?? 2);
  if (!Number.isFinite(multiplier) || multiplier <= 1) return null;

  const rawDays = config.flash_days;
  const days = Array.isArray(rawDays)
    ? rawDays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];

  return { multiplier, startHour, endHour, days };
}

/**
 * Fecha desplazada para que sus getters UTC lean como reloj de pared de CDMX.
 * Solo debe leerse con `getUTC*`.
 */
function mexicoWallClock(now: Date): Date {
  return new Date(now.getTime() - MEXICO_UTC_OFFSET_MS);
}

/** ¿Hoy es uno de los días configurados? Ignora la hora. */
export function isFlashOfferToday(
  config: Record<string, unknown> | null | undefined,
  now: Date = new Date(),
): boolean {
  const offer = parseFlashOffer(config);
  if (!offer) return false;
  if (offer.days.length === 0) return true;
  return offer.days.includes(mexicoWallClock(now).getUTCDay());
}

/** ¿La ventana está corriendo en este momento? */
export function isFlashOfferActive(
  config: Record<string, unknown> | null | undefined,
  now: Date = new Date(),
): boolean {
  const offer = parseFlashOffer(config);
  if (!offer) return false;

  const mexico = mexicoWallClock(now);
  if (offer.days.length > 0 && !offer.days.includes(mexico.getUTCDay())) return false;

  const hour = mexico.getUTCHours();
  return hour >= offer.startHour && hour < offer.endHour;
}

// ── Formato para mostrar al cliente ──────────────────────────────────────────

/** `2` → `"2×"` · `1.5` → `"1.5×"` (sin decimales de relleno). */
export function formatMultiplier(multiplier: number): string {
  return `${Number.isInteger(multiplier) ? multiplier : multiplier.toFixed(1)}×`;
}

/** `14` → `"2 pm"` · `0` → `"12 am"` · `12` → `"12 pm"`. */
export function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const h12    = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Lista de días legible. Detecta el caso "todos los días" y el rango corrido
 * más común (lunes a viernes) para no escupir una enumeración larga.
 */
export function formatFlashDays(days: number[]): string {
  if (days.length === 0 || days.length === 7) return 'todos los días';

  const sorted = [...new Set(days)].sort((a, b) => a - b);

  // Rango corrido de 3+ días sin domingo de por medio → "lunes a viernes".
  const isRun = sorted.length >= 3 && sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (isRun) return `${DAY_NAMES[sorted[0]]} a ${DAY_NAMES[sorted[sorted.length - 1]]}`;

  const names = sorted.map((d) => DAY_NAMES[d]);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}
