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

/** Country prefixes selectable in Settings and in the new-customer modal. */
export const PHONE_PREFIXES = [
  { code: '+52',  iso: 'MX', name: 'México'            },
  { code: '+54',  iso: 'AR', name: 'Argentina'          },
  { code: '+1',   iso: 'US', name: 'EE.UU. / Canadá'   },
  { code: '+57',  iso: 'CO', name: 'Colombia'           },
  { code: '+56',  iso: 'CL', name: 'Chile'              },
  { code: '+55',  iso: 'BR', name: 'Brasil'             },
  { code: '+51',  iso: 'PE', name: 'Perú'               },
  { code: '+598', iso: 'UY', name: 'Uruguay'            },
  { code: '+595', iso: 'PY', name: 'Paraguay'           },
  { code: '+591', iso: 'BO', name: 'Bolivia'            },
  { code: '+593', iso: 'EC', name: 'Ecuador'            },
  { code: '+502', iso: 'GT', name: 'Guatemala'          },
  { code: '+503', iso: 'SV', name: 'El Salvador'        },
  { code: '+504', iso: 'HN', name: 'Honduras'           },
  { code: '+505', iso: 'NI', name: 'Nicaragua'          },
  { code: '+506', iso: 'CR', name: 'Costa Rica'         },
  { code: '+507', iso: 'PA', name: 'Panamá'             },
  { code: '+509', iso: 'HT', name: 'Haití'              },
  { code: '+53',  iso: 'CU', name: 'Cuba'               },
  { code: '+34',  iso: 'ES', name: 'España'             },
  { code: '+44',  iso: 'GB', name: 'Reino Unido'        },
  { code: '+49',  iso: 'DE', name: 'Alemania'           },
  { code: '+33',  iso: 'FR', name: 'Francia'            },
  { code: '+39',  iso: 'IT', name: 'Italia'             },
];

/**
 * Country-specific WhatsApp formatting warnings.
 * Shown when capturing a customer's phone so messages actually deliver.
 */
export const PHONE_WA_HINTS: Record<string, string> = {
  '+54': 'Para WhatsApp en Argentina incluye el 9 al inicio (ej. 9 11 23456789), si no el mensaje no se entrega.',
};

const FALLBACK = { min: 6, max: 15, hint: '6–15 dígitos' };

export function getLocalLimits(prefix: string | null) {
  if (!prefix) return FALLBACK;
  return PHONE_LOCAL_LIMITS[prefix] ?? FALLBACK;
}
