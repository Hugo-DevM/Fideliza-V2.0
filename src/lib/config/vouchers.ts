/**
 * Reglas de vigencia de vouchers.
 *
 * Un voucher con vigencia muy corta nace y muere entre dos corridas del cron de
 * recordatorio, así que el cliente nunca se entera de que estaba por vencer.
 *
 * El cron `/api/cron/voucher-expiry` corre una vez al día y selecciona los
 * vouchers que vencen dentro de los próximos 3 días. Un voucher emitido con N
 * días de vigencia entra a esa ventana en T+N-3, y la primera corrida que lo
 * alcanza puede tardar hasta 24 h más. Con N ≤ 3 el aviso llega el mismo día del
 * vencimiento o ya no llega; con N = 5 quedan ~2 días completos de margen para
 * que el cliente actúe.
 *
 * Aplica a las dos vías que emiten voucher:
 *   - `rewards.expiry_days`         → canje de recompensa
 *   - `tiers[].gift_expiry_days`    → cupón de regalo por subir de nivel VIP
 *
 * NO aplica a los bonos de cumpleaños/reactivación: esos viven en
 * `customer_bonus_credits`, que el cron de vencimiento no consulta.
 */
export const MIN_VOUCHER_EXPIRY_DAYS = 5;

/** Texto único para inputs y mensajes de error, para que no se desincronicen. */
export const VOUCHER_EXPIRY_HINT =
  `La vigencia debe ser de al menos ${MIN_VOUCHER_EXPIRY_DAYS} días para que el ` +
  `recordatorio de vencimiento alcance a enviarse.`;
