/**
 * Local digit counts for each country calling code.
 * These are the digits the user types *after* the country prefix.
 */
export const PHONE_LOCAL_LIMITS: Record<string, { min: number; max: number; hint: string }> = {
  '+1':   { min: 10, max: 10, hint: '10 dígitos'      }, // EE.UU. / Canadá
  '+33':  { min: 9,  max: 9,  hint: '9 dígitos'       }, // Francia
  '+34':  { min: 9,  max: 9,  hint: '9 dígitos'       }, // España
  '+39':  { min: 9,  max: 11, hint: '9–11 dígitos'    }, // Italia
  '+44':  { min: 10, max: 10, hint: '10 dígitos'      }, // Reino Unido
  '+49':  { min: 10, max: 11, hint: '10–11 dígitos'   }, // Alemania
  '+51':  { min: 9,  max: 9,  hint: '9 dígitos'       }, // Perú
  '+52':  { min: 10, max: 10, hint: '10 dígitos'      }, // México
  '+53':  { min: 8,  max: 8,  hint: '8 dígitos'       }, // Cuba
  '+54':  { min: 10, max: 11, hint: '10–11 dígitos'   }, // Argentina
  '+55':  { min: 10, max: 11, hint: '10–11 dígitos'   }, // Brasil
  '+56':  { min: 9,  max: 9,  hint: '9 dígitos'       }, // Chile
  '+57':  { min: 10, max: 10, hint: '10 dígitos'      }, // Colombia
  '+591': { min: 8,  max: 9,  hint: '8–9 dígitos'     }, // Bolivia
  '+593': { min: 9,  max: 9,  hint: '9 dígitos'       }, // Ecuador
  '+595': { min: 9,  max: 9,  hint: '9 dígitos'       }, // Paraguay
  '+598': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Uruguay
  '+502': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Guatemala
  '+503': { min: 8,  max: 8,  hint: '8 dígitos'       }, // El Salvador
  '+504': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Honduras
  '+505': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Nicaragua
  '+506': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Costa Rica
  '+507': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Panamá
  '+509': { min: 8,  max: 8,  hint: '8 dígitos'       }, // Haití
};

const FALLBACK = { min: 6, max: 15, hint: '6–15 dígitos' };

export function getLocalLimits(prefix: string | null) {
  if (!prefix) return FALLBACK;
  return PHONE_LOCAL_LIMITS[prefix] ?? FALLBACK;
}
