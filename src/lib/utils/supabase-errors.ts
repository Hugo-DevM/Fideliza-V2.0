/**
 * Translates Supabase Auth error messages (which arrive in English) to Spanish.
 */
export function translateAuthError(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
    return 'Correo o contraseña incorrectos.';

  if (msg.includes('email not confirmed'))
    return 'Confirma tu correo antes de iniciar sesión.';

  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('an account with this email already exists') ||
    msg.includes('already exists')
  )
    return 'Este correo ya está registrado. Inicia sesión o usa otro correo.';

  if (msg.includes('password should be at least'))
    return 'La contraseña debe tener al menos 8 caracteres.';

  if (msg.includes('password is too weak') || msg.includes('weak password'))
    return 'La contraseña es demasiado débil. Usa letras, números y símbolos.';

  if (msg.includes('password has been found in a data breach') || msg.includes('pwned'))
    return 'Esta contraseña es conocida y poco segura. Elige una diferente.';

  if (
    msg.includes('unable to validate email') ||
    msg.includes('invalid email') ||
    msg.includes('invalid format')
  )
    return 'El formato del correo no es válido.';

  if (msg.includes('email rate limit') || msg.includes('rate limit'))
    return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';

  if (msg.includes('for security purposes, you can only request this after'))
    return 'Por seguridad, espera unos segundos antes de volver a intentarlo.';

  if (msg.includes('signup is disabled') || msg.includes('signups not allowed'))
    return 'El registro está deshabilitado temporalmente.';

  if (msg.includes('email link is invalid or has expired') || msg.includes('token has expired'))
    return 'El enlace expiró o ya fue usado. Solicita uno nuevo.';

  if (msg.includes('user not found'))
    return 'No existe una cuenta con ese correo.';

  if (msg.includes('error sending confirmation email') || msg.includes('sending confirmation'))
    return 'No se pudo enviar el correo de confirmación. Intenta de nuevo en unos minutos.';

  if (msg.includes('network') || msg.includes('fetch'))
    return 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';

  if (msg.includes('email address') && msg.includes('long'))
    return 'El correo electrónico es demasiado largo.';

  // Fallback: return original so nothing is swallowed silently
  return message;
}
