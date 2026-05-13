import { ImageResponse } from 'next/og';
import { getDictionary, isValidLocale, type Locale } from '@/lib/i18n';

export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale   = isValidLocale(lang) ? (lang as Locale) : 'en';
  const dict     = await getDictionary(locale);

  const tagline =
    locale === 'es'
      ? 'Sin descargas. Sin complejidad. Solo clientes que regresan.'
      : 'No app downloads. No complexity. Just customers coming back.';

  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          padding:        '64px',
          fontFamily:     'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo text */}
        <div
          style={{
            fontSize:     80,
            fontWeight:   800,
            color:        '#ffffff',
            letterSpacing: '-2px',
            marginBottom: '24px',
            display:      'flex',
            alignItems:   'center',
            gap:          '4px',
          }}
        >
          Fideliza
          <span style={{ color: '#818cf8' }}>+</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize:   28,
            color:      'rgba(255,255,255,0.75)',
            textAlign:  'center',
            maxWidth:   '800px',
            lineHeight: 1.4,
            marginBottom: '48px',
          }}
        >
          {tagline}
        </div>

        {/* Pills */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'row',
            gap:            '16px',
          }}
        >
          {(['Points', 'Stamps', 'Visits'] as const).map((label) => (
            <div
              key={label}
              style={{
                background:   'rgba(255,255,255,0.12)',
                border:       '1px solid rgba(255,255,255,0.2)',
                borderRadius: '999px',
                padding:      '8px 24px',
                color:        '#c7d2fe',
                fontSize:     20,
                fontWeight:   600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position:   'absolute',
            bottom:     '40px',
            fontSize:   20,
            color:      'rgba(255,255,255,0.4)',
          }}
        >
          fideliza.app
        </div>
      </div>
    ),
    { ...size },
  );
}
