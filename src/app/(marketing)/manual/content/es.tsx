import {
  Section, SubSection, GuiddeBox, DataTable, StepList, Note, Code, InlineCode,
} from '../components';

export const tocEs = [
  { id: 'introduccion',    label: '1. Introducción' },
  { id: 'primeros-pasos',  label: '2. Primeros pasos' },
  { id: 'navegacion',      label: '3. Navegación' },
  { id: 'dashboard',       label: '4.1 Dashboard' },
  { id: 'clientes',        label: '4.2 Clientes' },
  { id: 'programas',       label: '4.3 Programas' },
  { id: 'recompensas',     label: '4.4 Recompensas' },
  { id: 'portal-cliente',  label: '4.5 Portal del cliente' },
  { id: 'configuracion',   label: '4.6 Configuración y marca' },
  { id: 'facturacion',     label: '4.7 Facturación' },
  { id: 'registro-rapido', label: '4.8 Registro rápido' },
  { id: 'planes',          label: '5. Planes' },
  { id: 'errores',         label: '6. Errores y validaciones' },
  { id: 'buenas-practicas',label: '7. Buenas prácticas' },
  { id: 'faq',             label: '8. FAQ' },
];

export function ContentEs() {
  return (
    <>
      {/* ─ 1. Introducción ─ */}
      <Section id="introduccion" title="1. Introducción">
        <p>
          <strong className="text-indigo-400 font-bold">Fideliza</strong> es una plataforma SaaS de
          fidelización de clientes. Permite a negocios crear y gestionar programas de
          lealtad sin necesidad de apps móviles ni hardware especial.
        </p>
        <DataTable
          headers={['Actor', 'Cómo accede', 'URL']}
          rows={[
            ['Negocio (admin)', 'Email + contraseña o enlace mágico', 'app.fideliza.app/auth/login'],
            ['Cliente final',   'Código de acceso (sin contraseña)',  '[tunegocio].fideliza.app/c'],
          ]}
        />
        <Note>
          Cada negocio tiene su propio subdominio. Por ejemplo:{' '}
          <Code>cafeteria-roma.fideliza.app</Code>. Los datos de cada negocio
          están completamente aislados de los demás.
        </Note>
      </Section>

      {/* ─ 2. Primeros pasos ─ */}
      <Section id="primeros-pasos" title="2. Primeros pasos">
        <SubSection id="registro" title="2.1 Crear una cuenta">
          <p>El registro tiene <strong className="text-white">2 pasos</strong>:</p>

          <p className="font-medium text-white">Paso 1 — Datos de cuenta</p>
          <StepList steps={[
            'Ve a app.fideliza.app/auth/register',
            'Ingresa tu nombre completo',
            'Ingresa tu correo electrónico',
            'Crea una contraseña (mínimo 8 caracteres) — el sistema muestra un indicador de fortaleza',
            'Confirma la contraseña',
            'Acepta los Términos de Servicio y la Política de Privacidad',
            'Haz clic en Continuar',
          ]} />

          <p className="font-medium text-white pt-2">Paso 2 — Datos del negocio</p>
          <StepList steps={[
            'Ingresa el nombre de tu negocio',
            'El sistema sugiere automáticamente un subdominio (ej. cafeteria-roma)',
            'Puedes editarlo — el sistema verifica en tiempo real si está disponible',
            'Una vez disponible, verás la URL de tu portal: [subdominio].fideliza.app/c',
            'Haz clic en Crear cuenta',
          ]} />

          <Note>
            El subdominio debe tener entre 3 y 63 caracteres, solo letras minúsculas,
            números y guiones. No puede empezar ni terminar con guión.
          </Note>
        </SubSection>

        <SubSection id="primer-ingreso" title="2.2 Primer ingreso al sistema">
          <p>Al ingresar por primera vez verás el dashboard con estadísticas en cero y acciones sugeridas.</p>
          <p className="font-medium text-white">Flujo recomendado de configuración inicial:</p>
          <StepList steps={[
            'Ir a Configuración → personalizar colores y mensaje de bienvenida',
            'Crear al menos un Programa de fidelización',
            'Agregar Recompensas al programa',
            'Registrar los primeros Clientes',
            'Compartir la URL del portal con tus clientes',
          ]} />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Abrir navegador → ir a app.fideliza.app/auth/register',
            'Completar Paso 1: nombre, email, contraseña (mostrar el indicador de fortaleza), aceptar términos',
            'Clic en Continuar → aparece el Paso 2',
            'Escribir nombre del negocio → mostrar cómo el subdominio se genera automáticamente',
            'Editar manualmente el subdominio → mostrar el mensaje de disponibilidad',
            'Clic en Crear cuenta → mostrar el dashboard vacío con estadísticas en cero',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 3. Navegación ─ */}
      <Section id="navegacion" title="3. Navegación del sistema">
        <DataTable
          headers={['Sección', 'URL', 'Qué contiene']}
          rows={[
            ['Dashboard',          '/dashboard',                   'Estadísticas, actividad reciente, accesos rápidos'],
            ['Clientes',           '/dashboard/customers',         'Lista, búsqueda, creación de clientes'],
            ['Detalle de cliente', '/dashboard/customers/[id]',    'Historial, inscripciones, vouchers'],
            ['Programas',          '/dashboard/programs',          'Lista de programas de fidelización'],
            ['Detalle programa',   '/dashboard/programs/[id]',     'Recompensas, transacciones, controles de estado'],
            ['Registro rápido',    '/dashboard/quick',             'Modo rápido para registro en tienda'],
            ['Configuración',      '/dashboard/settings',          'Marca, facturación, cuenta'],
          ]}
        />
      </Section>

      {/* ─ 4.1 Dashboard ─ */}
      <Section id="dashboard" title="4.1 Dashboard principal">
        <p>Muestra un resumen en tiempo real del estado del negocio.</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {([
            ['Clientes activos',    'Total de clientes con estado activo'],
            ['Programas activos',   'Programas en estado "activo"'],
            ['Transacciones hoy',   'Movimientos registrados en el día'],
            ['Vouchers pendientes', 'Recompensas emitidas aún no canjeadas'],
          ] as [string, string][]).map(([t, d]) => (
            <div key={t} className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <p className="font-medium text-white text-sm">{t}</p>
              <p className="text-gray-400 text-xs mt-0.5">{d}</p>
            </div>
          ))}
        </div>
        <ul className="list-disc pl-5 space-y-1 pt-2">
          <li><strong className="text-white">Actividad reciente</strong> — últimas 8 transacciones del sistema</li>
          <li><strong className="text-white">Programas activos</strong> — acceso directo a los programas en curso</li>
          <li><strong className="text-white">URL del portal del cliente</strong> — enlace listo para compartir</li>
          <li><strong className="text-white">Exportación CSV</strong> (solo plan Pro) — descarga el historial completo</li>
        </ul>
        <GuiddeBox>
          <StepList steps={[
            'Ingresar al dashboard → mostrar las 4 tarjetas de estadísticas',
            'Hacer scroll → mostrar la sección de actividad reciente',
            'Mostrar los programas activos',
            'Señalar la URL del portal del cliente y copiarla',
            '(Plan Pro) Mostrar el botón de exportación CSV',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.2 Clientes ─ */}
      <Section id="clientes" title="4.2 Clientes">
        <p>
          Permite registrar, buscar y gestionar los clientes del negocio.
          La tabla muestra: nombre, código de acceso, teléfono, estado, fecha de registro
          y un enlace al detalle.
        </p>

        <SubSection id="crear-cliente" title="Crear un cliente">
          <StepList steps={[
            'Ir a Clientes en el menú lateral',
            'Clic en Agregar cliente',
            'Nombre (obligatorio, máx. 150 caracteres)',
            'Teléfono (opcional — formato internacional, ej. +52 55 1234 5678)',
            'Notas internas (opcional, máx. 500 caracteres — no visibles para el cliente)',
            'Clic en Guardar',
          ]} />
          <Note>
            El sistema genera automáticamente un código de acceso único. Ese código es el
            identificador del cliente en el portal — sin contraseña.
          </Note>
        </SubSection>

        <SubSection id="detalle-cliente" title="Ver detalle de un cliente">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Encabezado:</strong> nombre, estado, código de acceso, teléfono, fecha, notas, botón activar/desactivar</li>
            <li><strong className="text-white">Inscripciones:</strong> cada programa al que está inscrito, balance actual y total histórico</li>
            <li><strong className="text-white">Vouchers:</strong> código, nombre de recompensa, estado, vencimiento</li>
            <li><strong className="text-white">Historial de transacciones:</strong> tipo, variación, balance resultante, nota, fecha</li>
          </ul>
          <DataTable
            headers={['Tipo', 'Ícono', 'Descripción']}
            rows={[
              ['Ganar',     '➕', 'Puntos, sellos o visitas acumulados'],
              ['Canjear',   '🎁', 'Recompensa emitida como voucher'],
              ['Ajuste',    '✏️', 'Corrección manual del balance'],
              ['Expirar',   '⏰', 'Puntos vencidos automáticamente'],
              ['Reembolso', '↩️', 'Devolución de puntos'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Clientes → mostrar la lista',
            'Clic en Agregar cliente',
            'Rellenar: nombre "Ana García", teléfono "+52 55 9876 5432", notas "Cliente frecuente"',
            'Clic en Guardar → mostrar el cliente en la lista con su código de acceso generado',
            'Hacer clic en Ver → mostrar el perfil completo',
            'Mostrar las secciones: Inscripciones, Vouchers, Historial',
            'Clic en el botón de estado → mostrar el cambio activo/inactivo',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.3 Programas ─ */}
      <Section id="programas" title="4.3 Programas de fidelización">
        <DataTable
          headers={['Tipo', 'Ícono', 'Descripción', 'Config requerida']}
          rows={[
            ['Puntos',   '⭐', 'Acumulan puntos por gasto',            'Puntos por dólar (1–10,000) · Mínimo para canjear'],
            ['Sellos',   '🎟️', 'Tarjeta de sellos digital',            'Sellos por tarjeta (2–100)'],
            ['Visitas',  '📍', 'Recompensa por frecuencia de visitas', 'Visitas necesarias (2–500)'],
            ['Cashback', '💰', 'Porcentaje de retorno sobre compra',   '% de cashback (0.1–50%) · Compra mínima (opc.)'],
          ]}
        />
        <Note>Los tipos disponibles dependen de tu plan. Ver sección 5.</Note>

        <SubSection id="crear-programa" title="Crear un programa">
          <StepList steps={[
            'Ir a Programas en el menú lateral',
            'Clic en Agregar programa',
            'Nombre (2–150 caracteres)',
            'Descripción (opcional, máx. 500 caracteres)',
            'Seleccionar el tipo (Puntos, Sellos, Visitas o Cashback)',
            'Completar la configuración específica del tipo elegido',
            'Máximo de inscripciones (opcional — vacío = ilimitado)',
            'Fecha de inicio y fin (opcional — fin debe ser posterior al inicio)',
            'Clic en Crear',
          ]} />
        </SubSection>

        <SubSection id="estados-programa" title="Estados de un programa">
          <InlineCode>Borrador → Activo → Pausado → Archivado</InlineCode>
          <DataTable
            headers={['Estado', 'Descripción']}
            rows={[
              ['Borrador',  'Solo visible para el admin. Los clientes no lo ven.'],
              ['Activo',    'Los clientes pueden inscribirse y acumular.'],
              ['Pausado',   'No acepta nuevas transacciones temporalmente.'],
              ['Archivado', 'Finalizado. Solo consulta histórica.'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Programas → mostrar la lista',
            'Clic en Agregar programa',
            'Nombre: "Programa Puntos Café", tipo: Puntos',
            'Ingresar: 10 puntos por dólar, mínimo 100 puntos para canjear',
            'Clic en Crear → mostrar la tarjeta en la lista (estado: Borrador)',
            'Clic en la tarjeta → entrar al detalle',
            'Clic en Activar → mostrar el estado cambiado a "Activo"',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.4 Recompensas ─ */}
      <Section id="recompensas" title="4.4 Recompensas">
        <Note>Disponible a partir del plan Starter. El plan Gratis no incluye catálogo de recompensas.</Note>

        <SubSection id="crear-recompensa" title="Crear una recompensa">
          <StepList steps={[
            'Ir a Programas → seleccionar el programa',
            'En la sección Recompensas, clic en Agregar recompensa',
            'Nombre (obligatorio, 2–150 caracteres)',
            'Descripción (opcional, máx. 500 caracteres)',
            'Imagen (opcional — URL con HTTPS)',
            'Costo en puntos (obligatorio — número entero positivo)',
            'Stock (opcional — vacío = ilimitado)',
            'Días de expiración del voucher (opcional)',
            'Clic en Guardar',
          ]} />
        </SubSection>

        <SubSection id="verificar-voucher" title="Verificar un voucher en caja">
          <StepList steps={[
            'Ir al detalle del programa correspondiente',
            'En la sección Verificar voucher, ingresar el código que muestra el cliente',
            'El sistema valida que el voucher esté pendiente y no expirado',
            'Confirmar el canje',
          ]} />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Ir a un programa activo → sección Recompensas',
            'Clic en Agregar recompensa',
            'Nombre: "Café gratis", costo: 100 puntos, stock: 50',
            'Clic en Guardar → mostrar la recompensa en la tabla',
            'Desplazarse a Verificar voucher → escribir un código de ejemplo',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.5 Portal del cliente ─ */}
      <Section id="portal-cliente" title="4.5 Portal del cliente">
        <p>
          Interfaz para el cliente final. Accede sin contraseña usando su código de acceso
          en la URL <Code>[subdominio].fideliza.app/c</Code>.
        </p>
        <Note>
          La URL puede incluir el código directamente: <Code>?code=XXXX</Code> — útil para compartir por WhatsApp o SMS.
        </Note>

        <SubSection id="portal-tabs" title="Las 3 pestañas del portal">
          <div className="space-y-3">
            {([
              ['⭐ Puntos',       'Vouchers pendientes · Tarjetas de inscripción con balance, progreso, sellos o contador de visitas'],
              ['🎁 Recompensas', 'Catálogo de recompensas · Barra de progreso · Indicador de puntos suficientes · Botón Canjear'],
              ['📋 Historial',   'Lista de transacciones recientes con ícono, tipo, variación y fecha'],
            ] as [string, string][]).map(([title, desc]) => (
              <div key={title} className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Abrir pestaña de incógnito (para simular la vista del cliente)',
            'Navegar a [subdominio].fideliza.app/c',
            'Ingresar un código de acceso válido → mostrar cómo carga el portal',
            'Pestaña Puntos: tarjetas de inscripción y progreso',
            'Pestaña Recompensas: catálogo, barra de progreso, clic en Canjear → voucher generado',
            'Pestaña Historial: lista de transacciones',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.6 Configuración ─ */}
      <Section id="configuracion" title="4.6 Configuración y marca">
        <DataTable
          headers={['Campo', 'Descripción', 'Restricción']}
          rows={[
            ['Color primario',       'Color del encabezado y botones del portal',         'Formato hex (#RRGGBB)'],
            ['Color secundario',     'Degradado del encabezado del portal',               'Formato hex (#RRGGBB)'],
            ['Mensaje de bienvenida','Texto que ve el cliente al entrar al portal',       'Máx. 500 caracteres'],
            ['Etiqueta del programa','Nombre alternativo para los puntos (ej. "Estrellas")', '1–50 caracteres'],
            ['Ícono de sello',       'Emoji o nombre de ícono para los sellos',          '1–50 caracteres'],
            ['URL de términos',      'Enlace a tus términos y condiciones',              'Solo HTTPS'],
          ]}
        />
        <GuiddeBox>
          <StepList steps={[
            'Ir a Configuración en el menú',
            'Cambiar el color primario → seleccionar un nuevo color',
            'Escribir mensaje de bienvenida: "¡Gracias por visitarnos!"',
            'Cambiar etiqueta del programa a "Estrellas"',
            'Clic en Guardar',
            'Abrir el portal del cliente en otra pestaña → verificar los cambios aplicados',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.7 Facturación ─ */}
      <Section id="facturacion" title="4.7 Facturación y planes">
        <p>
          Desde <strong className="text-white">Configuración → Facturación</strong> puedes
          ver tu plan actual, hacer upgrade y administrar el método de pago.
          Los pagos son gestionados por Stripe. <strong className="text-indigo-400 font-bold">Fideliza</strong> no almacena datos de tarjetas.
        </p>
        <Note>
          Si el pago falla, el sistema revierte automáticamente al plan Gratis hasta
          regularizar el pago. Verás un banner naranja en el dashboard.
        </Note>
        <GuiddeBox>
          <StepList steps={[
            'Ir a Configuración → sección Facturación',
            'Mostrar el plan actual con sus límites',
            'Clic en upgrade → mostrar la previsualización de costo',
            'Mostrar la redirección a Stripe Checkout (sin completar el pago)',
            'Volver → mostrar el botón "Administrar método de pago"',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.8 Registro rápido ─ */}
      <Section id="registro-rapido" title="4.8 Registro rápido">
        <p>
          Modo de entrada rápida pensado para el personal en tienda.
          Disponible en <Code>/dashboard/quick</Code>.
        </p>
        <StepList steps={[
          'Ir a Registro rápido en el menú lateral',
          'Ingresar el código de acceso del cliente',
          'El sistema carga automáticamente el cliente y sus inscripciones activas',
          'Seleccionar el programa y registrar la transacción',
          'Confirmar — la transacción queda registrada inmediatamente',
        ]} />
        <GuiddeBox>
          <StepList steps={[
            'Ir a Registro rápido desde el menú',
            'Escribir el código de acceso de un cliente existente',
            'Mostrar cómo carga los datos del cliente y sus programas',
            'Seleccionar el programa → ingresar el monto o acción',
            'Confirmar → mostrar la confirmación en pantalla',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 5. Planes ─ */}
      <Section id="planes" title="5. Planes y limitaciones">
        <DataTable
          headers={['Característica', 'Gratis', 'Starter', 'Pro']}
          rows={[
            ['Clientes máximos',             '50',                   '500',                        'Ilimitado'],
            ['Programas máximos',            '1',                    '3',                          'Ilimitado'],
            ['Tipos de programa',            'Puntos, Sellos',       'Puntos, Sellos, Visitas',    'Puntos, Sellos, Visitas, Cashback'],
            ['Historial de transacciones',   'Últimas 50',           'Ilimitado',                  'Ilimitado'],
            ['Catálogo de recompensas',      '✗',                    '✓',                          '✓'],
            ['Exportación CSV',              '✗',                    '✗',                          '✓'],
            ['Soporte prioritario',          '✗',                    '✗',                          '✓'],
          ]}
        />
        <Note>
          Si el pago falla o la suscripción se cancela, el sistema aplica las restricciones
          del plan Gratis. Los datos existentes se conservan.
        </Note>
      </Section>

      {/* ─ 6. Errores ─ */}
      <Section id="errores" title="6. Errores y validaciones">
        <p className="font-medium text-white">Clientes</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['A customer with this phone number already exists', 'El teléfono ya está registrado', 'Verificar si el cliente ya existe en la lista'],
            ['Failed to generate unique access code after 5 attempts', 'Error interno', 'Intentar de nuevo; contactar soporte si persiste'],
          ]}
        />
        <p className="font-medium text-white mt-4">Programas</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Tu plan [X] permite máximo [N] programas', 'Límite del plan alcanzado', 'Actualizar el plan desde Configuración'],
            ['El tipo "[tipo]" no está disponible en el plan [X]', 'Tipo no incluido en el plan', 'Actualizar el plan'],
            ['ends_at must be after starts_at', 'La fecha de fin es anterior a la de inicio', 'Corregir las fechas'],
          ]}
        />
        <p className="font-medium text-white mt-4">Transacciones</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Customer not found or inactive', 'El cliente no existe o está desactivado', 'Verificar el cliente en la lista'],
            ['Program not found or not active', 'El programa está pausado o archivado', 'Cambiar estado del programa a Activo'],
            ['Adjustment would result in negative balance', 'El ajuste dejaría balance negativo', 'Ingresar un ajuste menor'],
            ['Customer must be enrolled in this program first', 'Cliente no inscrito', 'Inscribir al cliente en el programa'],
          ]}
        />
        <p className="font-medium text-white mt-4">Canjes</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Reward is out of stock', 'La recompensa agotó su stock', 'Actualizar el stock o desactivar la recompensa'],
            ['[cliente] does not have enough [label] to redeem', 'Balance insuficiente', 'El cliente debe seguir acumulando'],
            ['Redemption code not found', 'El código de voucher no existe', 'Verificar que el código esté escrito correctamente'],
            ['Redemption voucher has expired', 'El voucher venció', 'El cliente debe solicitar uno nuevo'],
            ['Redemption is not pending', 'El voucher ya fue usado o cancelado', 'El voucher no es válido para canje'],
          ]}
        />
        <p className="font-medium text-white mt-4">Portal del cliente</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Código no encontrado. Verifícalo e inténtalo de nuevo.', 'El código de acceso es incorrecto', 'Verificar el código en el panel de admin'],
          ]}
        />
      </Section>

      {/* ─ 7. Buenas prácticas ─ */}
      <Section id="buenas-practicas" title="7. Buenas prácticas">
        <div className="space-y-5">
          {([
            ['Configuración inicial', [
              'Define los colores antes de lanzar el portal. El cliente verá la identidad de tu marca desde el primer acceso.',
              'Escribe un mensaje de bienvenida. Aparece en el portal y mejora la experiencia.',
              'Personaliza la etiqueta de puntos: "Estrellas", "Granos", "Millas".',
            ]],
            ['Gestión de programas', [
              'Empieza con un solo programa. Es más fácil de comunicar y escalar.',
              'Usa el estado Borrador para preparar un programa antes de lanzarlo.',
              'No elimines programas. Usa Archivado para mantener el historial.',
            ]],
            ['Gestión de clientes', [
              'Agrega el teléfono del cliente cuando sea posible.',
              'Usa notas internas para registrar preferencias especiales.',
              'No desactives clientes sin motivo — perderán acceso al portal.',
            ]],
            ['Recompensas', [
              'Configura stock en recompensas físicas para evitar sobre-emitir.',
              'Usa días de expiración para crear urgencia (ej. 30 días).',
              'Desactiva recompensas en lugar de eliminarlas.',
            ]],
            ['Operación diaria', [
              'Usa Registro rápido en tienda para agilizar la atención.',
              'Revisa el Dashboard al inicio del día.',
              'Exporta el CSV mensualmente (plan Pro) para tener respaldo.',
            ]],
          ] as [string, string[]][]).map(([title, items]) => (
            <div key={title}>
              <p className="font-semibold text-white mb-2">{title}</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ─ 8. FAQ ─ */}
      <Section id="faq" title="8. Preguntas frecuentes">
        <div className="space-y-4">
          {([
            ['¿Los clientes necesitan instalar una app?',
             'No. El portal es una web que funciona desde cualquier navegador. Sin instalación.'],
            ['¿Cómo recibe el cliente su código de acceso?',
             'Tú se lo entregas al registrarlo. Aparece en la lista de clientes y en su ficha de detalle.'],
            ['¿Puede un cliente perder sus puntos si pierde el código?',
             'No. Puedes buscar al cliente por nombre o teléfono, recuperar su código y compartírselo.'],
            ['¿Se pueden tener varios negocios en una sola cuenta?',
             'No. Cada cuenta está asociada a un único negocio. Para múltiples negocios necesitas cuentas separadas.'],
            ['¿Se pueden eliminar transacciones?',
             'No. El historial es inmutable. Si hay un error, usa una transacción de tipo Ajuste.'],
            ['¿El cliente puede ver datos de otros clientes?',
             'No. El portal solo muestra información de ese cliente específico.'],
            ['¿Qué son los "vouchers pendientes"?',
             'Recompensas que el cliente ya canjeó desde el portal pero que aún no fueron verificadas físicamente en caja.'],
            ['¿Cuándo expiran los vouchers?',
             'Depende de la configuración de la recompensa. Sin configuración de expiración, el voucher no vence.'],
            ['¿Puedo pausar un programa sin perder datos?',
             'Sí. El estado Pausado detiene nuevas transacciones pero conserva todos los balances e historial.'],
            ['¿Qué pasa si cambio de plan?',
             'Si subes, las funciones quedan disponibles de inmediato. Si bajas (o hay problema de pago), se aplican las restricciones del plan Gratis pero los datos se conservan.'],
          ] as [string, string][]).map(([q, a]) => (
            <div key={q} className="border-b border-white/5 pb-4 last:border-0">
              <p className="font-medium text-white mb-1">{q}</p>
              <p className="text-gray-400 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
