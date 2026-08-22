/**
 * Destino post-login para el flujo de OAuth.
 *
 * El `next` viaja en una cookie y no colgado del `redirectTo` que se le pasa a
 * signInWithOAuth: Supabase valida esa URL contra la lista de Redirect URLs
 * del proyecto, así que añadirle `?next=…` la deja fuera de la lista salvo que
 * allá exista un comodín — configuración de dashboard que este código no
 * controla ni puede verificar. La cookie no depende de nada externo.
 *
 * Sin secretos dentro: solo una ruta relativa, que además se sanea al leerla.
 */

export const POST_AUTH_NEXT_COOKIE = 'fideliza_post_auth_next';

/** 10 minutos — lo que tarda un login con Google, no más. */
export const POST_AUTH_NEXT_MAX_AGE = 600;

/**
 * Sanea el destino post-login para evitar open redirects.
 * Solo acepta rutas relativas que empiecen con "/" pero NO con "//"
 * (relativas al protocolo), ni que contengan "\" o ":" (inyección de esquema).
 */
export function sanitizeNext(raw: string | null | undefined): string {
  if (
    raw &&
    raw.startsWith('/') &&
    !raw.startsWith('//') &&
    !raw.includes('\\') &&
    !raw.includes(':')
  ) {
    return raw;
  }
  return '/dashboard';
}
