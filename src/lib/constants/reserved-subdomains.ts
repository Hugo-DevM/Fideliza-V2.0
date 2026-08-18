/**
 * Subdominios que un negocio no puede reclamar.
 *
 * Un subdominio es permanente (la UI lo advierte: no se puede cambiar) y es
 * público bajo la marca. Hay tres razones para bloquear uno:
 *
 *  1. INFRAESTRUCTURA — nombres que Fideliza necesita o podría necesitar.
 *     Si un cliente se queda con `app` o `admin`, no hay forma de recuperarlo.
 *
 *  2. SUPLANTACIÓN — `soporte.fideliza.app` o `seguridad.fideliza.app` en manos
 *     de un tercero es una plataforma de phishing con el dominio legítimo. Es
 *     la categoría más peligrosa de las tres.
 *
 *  3. CONTENIDO OFENSIVO — aparecería como avalado por la marca.
 *
 * ── Sobre el matching ────────────────────────────────────────────────
 * Buscar por subcadena parece más estricto pero rompe nombres legítimos: "culo"
 * está dentro de "circulo" y "vinculo", "puto" dentro de "computo", "pito"
 * dentro de "capitolio", "ano" dentro de "hermano" y "urbano". Es el problema
 * clásico de Scunthorpe.
 *
 * Por eso el matching tiene tres niveles:
 *  - SISTEMA / SUPLANTACIÓN → solo contra el subdominio COMPLETO. Compararlos
 *    por segmento bloquearía `tienda-ana`, que no tiene nada de malo.
 *  - OFENSIVO EXACTO → contra el completo y contra cada segmento entre guiones,
 *    para bloquear `puta-cafe` sin bloquear `circulo`.
 *  - OFENSIVO POR SUBCADENA → solo términos largos que no aparecen dentro de
 *    palabras legítimas.
 *
 * Los tres se evalúan también sobre la versión sin sustituciones numéricas
 * (`p0rn`, `sh1t`, `put4`).
 */

/** Infraestructura y rutas del producto. */
const RESERVED_SYSTEM = [
  'www', 'app', 'apps', 'api', 'admin', 'administrator', 'root', 'system',
  'dashboard', 'panel', 'console', 'portal', 'auth', 'login', 'signin',
  'signup', 'register', 'onboard', 'logout',
  'mail', 'email', 'smtp', 'imap', 'pop', 'webmail', 'mx',
  'static', 'assets', 'cdn', 'media', 'img', 'images', 'files', 'download',
  'blog', 'docs', 'doc', 'documentation', 'manual', 'guia', 'guide',
  'help', 'ayuda', 'faq', 'status', 'health', 'ping',
  'dev', 'test', 'testing', 'staging', 'stage', 'demo', 'sandbox', 'beta',
  'alpha', 'preview', 'local', 'localhost',
  'ftp', 'ssh', 'vpn', 'proxy', 'ns', 'ns1', 'ns2', 'dns', 'server',
  'git', 'ci', 'build', 'deploy',
  'store', 'shop', 'tienda', 'checkout',
  'news', 'about', 'contact', 'contacto', 'legal', 'privacy', 'privacidad',
  'terms', 'terminos',
];

/**
 * Nombres que un tercero podría usar para hacerse pasar por Fideliza.
 * Esta lista es de seguridad, no de estética.
 */
const RESERVED_IMPERSONATION = [
  'fideliza', 'fidelizaapp', 'fidelizamx', 'hamcsoft',
  'soporte', 'support', 'servicio', 'atencion',
  'seguridad', 'security', 'secure', 'verify', 'verificacion', 'verificar',
  'account', 'accounts', 'cuenta', 'cuentas',
  'billing', 'facturacion', 'factura', 'pago', 'pagos', 'pay', 'payment',
  'password', 'contrasena', 'reset', 'recovery', 'recuperar',
  'oficial', 'official', 'noreply', 'no-reply', 'notificaciones',
];

/**
 * Términos ofensivos CORTOS o que aparecen dentro de palabras legítimas.
 * Solo coincidencia exacta (subdominio completo o segmento entre guiones).
 */
const OFFENSIVE_EXACT = [
  // Español
  'puta', 'puto', 'putas', 'putos', 'culo', 'culos', 'ano', 'teta', 'tetas',
  'coger', 'cojer', 'verga', 'vergas', 'pito', 'pitos', 'polla', 'pollas',
  'ojete', 'pinga', 'cono', 'zorra', 'zorras', 'perra', 'perras', 'joto',
  'jotos', 'puta madre', 'sexo', 'sexi', 'sexy', 'nalga', 'nalgas',
  // Inglés
  'ass', 'asses', 'dick', 'dicks', 'cock', 'cocks', 'tit', 'tits', 'cum',
  'anal', 'milf', 'nude', 'nudes', 'xxx', 'sex', 'nazi', 'rape',
  'slut', 'fag', 'fags', 'hoe', 'twat',
];

/**
 * Términos ofensivos LARGOS y distintivos: no aparecen dentro de palabras
 * legítimas, así que es seguro buscarlos como subcadena.
 */
const OFFENSIVE_SUBSTRING = [
  // Español
  'pendejo', 'pendeja', 'chinga', 'chingada', 'chingar', 'mierda', 'cabron',
  'cabrona', 'marica', 'maricon', 'pinche', 'mamada', 'mamon', 'huevon',
  'malparido', 'gonorrea', 'chupapoll', 'hijueputa', 'hijoputa', 'putazo',
  'porn', 'prostitu', 'masturba', 'follar', 'orgasmo', 'penetra', 'sexshop',
  // Inglés
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'whore', 'pussy',
  'blowjob', 'handjob', 'masturbat', 'pornhub', 'hentai', 'incest',
  'pedophil', 'pedofil',
  // Insultos discriminatorios
  'nigger', 'nigga', 'faggot', 'retard', 'tranny', 'chink', 'spic', 'kike',
  'wetback', 'towelhead',
];

/**
 * Sistema e impersonación se comparan SOLO contra el subdominio completo.
 * Compararlos por segmento bloquearía nombres perfectamente válidos:
 * `tienda-ana` no tiene nada de malo aunque `tienda` esté reservado.
 */
const SYSTEM = new Set([...RESERVED_SYSTEM, ...RESERVED_IMPERSONATION]);

/** Lo ofensivo sí se compara por segmento: bloquea `puta-cafe` y `cafe-puta`. */
const OFFENSIVE = new Set(OFFENSIVE_EXACT);

/**
 * Normaliza sustituciones numéricas comunes usadas para evadir filtros
 * (`p0rn`, `sh1t`, `fu(k` no aplica porque el charset ya excluye símbolos).
 * Solo se usa para la comparación ofensiva, nunca para la de sistema.
 */
function deLeet(value: string): string {
  return value
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');
}

export type ReservedReason = 'system' | 'offensive';

/**
 * Devuelve el motivo por el que el subdominio está bloqueado, o null si es
 * utilizable. Asume que ya pasó la validación de formato.
 */
export function checkReservedSubdomain(subdomain: string): ReservedReason | null {
  const clean = subdomain.toLowerCase().trim();
  if (!clean) return null;

  // 1. Sistema / impersonación — solo el subdominio completo
  if (SYSTEM.has(clean)) return 'system';

  // 2. Ofensivo exacto — completo o cualquier segmento, con y sin leet
  const relaxed  = deLeet(clean);
  const segments = [...clean.split('-'), ...relaxed.split('-')].filter(Boolean);
  if (OFFENSIVE.has(clean) || OFFENSIVE.has(relaxed) || segments.some((s) => OFFENSIVE.has(s))) {
    return 'offensive';
  }

  // 3. Ofensivo por subcadena
  if (OFFENSIVE_SUBSTRING.some((t) => clean.includes(t) || relaxed.includes(t))) {
    return 'offensive';
  }

  return null;
}

/** Mensaje para el usuario. No se le dice cuál lista lo rechazó. */
export function reservedSubdomainMessage(reason: ReservedReason): string {
  return reason === 'offensive'
    ? 'Este subdominio no está permitido. Elige otro.'
    : 'Este subdominio está reservado. Elige otro.';
}
