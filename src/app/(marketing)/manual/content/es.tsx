import {
  Section, SubSection, GuiddeBox, DataTable, StepList, Note, Code, InlineCode,
} from '../components';

export const tocEs = [
  { id: 'introduccion',    label: '1. Introducción' },
  { id: 'primeros-pasos',  label: '2. Primeros pasos' },
  { id: 'navegacion',      label: '3. Navegación' },
  { id: 'dashboard',       label: '4.1 Resumen' },
  { id: 'registro-rapido', label: '4.2 Registro rápido' },
  { id: 'clientes',        label: '4.3 Clientes' },
  { id: 'programas',       label: '4.4 Programas' },
  { id: 'recompensas',     label: '4.5 Recompensas' },
  { id: 'referidos',       label: '4.6 Referidos' },
  { id: 'niveles',         label: '4.7 Niveles VIP' },
  { id: 'bonos',           label: '4.8 Bonos' },
  { id: 'analiticas',      label: '4.9 Analíticas' },
  { id: 'portal-cliente',  label: '4.10 Portal del cliente' },
  { id: 'configuracion',   label: '4.11 Configuración y marca' },
  { id: 'soporte',         label: '4.12 Soporte' },
  { id: 'whatsapp',        label: '5. WhatsApp' },
  { id: 'facturacion',     label: '6. Facturación' },
  { id: 'planes',          label: '7. Planes' },
  { id: 'errores',         label: '8. Errores y validaciones' },
  { id: 'buenas-practicas',label: '9. Buenas prácticas' },
  { id: 'faq',             label: '10. FAQ' },
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
            ['Negocio (admin)', 'Email + contraseña, o cuenta de Google', 'fideliza.app/auth/login'],
            ['Cliente final',   'Código de acceso (sin contraseña)',      '[tunegocio].fideliza.app/c'],
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
          <p>
            El registro tiene <strong className="text-white">2 pasos</strong> más una
            confirmación por correo.
          </p>

          <p className="font-medium text-white">Paso 1 — Datos de cuenta</p>
          <StepList steps={[
            'Ve a fideliza.app/auth/register',
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

          <p className="font-medium text-white pt-2">Paso 3 — Confirma tu correo</p>
          <StepList steps={[
            'Te llevamos a una pantalla que dice "Revisa tu correo"',
            'Abre el correo de Fideliza y haz clic en el enlace de confirmación',
            'Con eso tu cuenta queda activa y entras al panel',
          ]} />

          <Note>
            El subdominio debe tener entre 3 y 63 caracteres, solo letras minúsculas,
            números y guiones. No puede empezar ni terminar con guión.
          </Note>

          <p className="pt-2">
            También puedes registrarte con <strong className="text-white">Registrarse con Google</strong>.
            En ese caso el correo ya viene verificado por Google y solo se te piden los datos
            del negocio.
          </p>
        </SubSection>

        <SubSection id="primer-ingreso" title="2.2 Primer ingreso al sistema">
          <p>
            Al ingresar por primera vez verás el panel con estadísticas en cero y una lista
            de tareas pendientes de configuración.
          </p>
          <p className="font-medium text-white">Flujo recomendado de configuración inicial:</p>
          <StepList steps={[
            'Ir a Configuración → subir tu logo y elegir los colores del portal',
            'Escribir el mensaje de bienvenida y la etiqueta de tu moneda de lealtad',
            'Configurar tu Región: país, prefijo telefónico y zona horaria',
            'Crear al menos un Programa de fidelización',
            'Agregar Recompensas al programa (plan Starter en adelante)',
            'Registrar los primeros Clientes',
            'Compartir la URL del portal con tus clientes',
          ]} />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Abrir navegador → ir a fideliza.app/auth/register',
            'Completar Paso 1: nombre, email, contraseña (mostrar el indicador de fortaleza), aceptar términos',
            'Clic en Continuar → aparece el Paso 2',
            'Escribir nombre del negocio → mostrar cómo el subdominio se genera automáticamente',
            'Editar manualmente el subdominio → mostrar el mensaje de disponibilidad',
            'Clic en Crear cuenta → mostrar la pantalla "Revisa tu correo"',
            'Abrir el correo → clic en el enlace → mostrar el panel vacío con estadísticas en cero',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 3. Navegación ─ */}
      <Section id="navegacion" title="3. Navegación del sistema">
        <p>El menú lateral está dividido en tres grupos.</p>

        <p className="font-medium text-white pt-2">Operación</p>
        <DataTable
          headers={['Sección', 'URL', 'Qué contiene']}
          rows={[
            ['Resumen',         '/dashboard',       'Estadísticas, actividad reciente, accesos rápidos'],
            ['Registro rápido', '/dashboard/quick', 'Modo rápido para registrar movimientos en tienda'],
          ]}
        />

        <p className="font-medium text-white pt-4">Gestión</p>
        <DataTable
          headers={['Sección', 'URL', 'Qué contiene', 'Plan']}
          rows={[
            ['Clientes',           '/dashboard/customers',      'Lista, búsqueda, creación de clientes',        'Todos'],
            ['Detalle de cliente', '/dashboard/customers/[id]', 'Historial, inscripciones, vouchers, misiones', 'Todos'],
            ['Programas',          '/dashboard/programs',       'Lista de programas de fidelización',           'Todos'],
            ['Detalle programa',   '/dashboard/programs/[id]',  'Recompensas, transacciones, ofertas flash, misiones, Sorpresa Especial', 'Todos'],
            ['Referidos',          '/dashboard/referidos',      'Programa de referidos y sus estadísticas',     'Pro'],
            ['Niveles VIP',        '/dashboard/tiers',          'Niveles Bronce, Plata y Oro con multiplicador','Pro'],
            ['Bonos',              '/dashboard/bonos',          'Bonos de cumpleaños y reactivación',           'Pro'],
            ['Analíticas',         '/dashboard/analytics',      'Retención, frecuencia, clientes en riesgo',    'Pro'],
          ]}
        />

        <p className="font-medium text-white pt-4">Cuenta</p>
        <DataTable
          headers={['Sección', 'URL', 'Qué contiene']}
          rows={[
            ['Soporte',       '/dashboard/soporte',  'Envío de tickets y respuestas del equipo'],
            ['Configuración', '/dashboard/settings', 'Logo, marca, región, portal, idioma, notificaciones, facturación'],
          ]}
        />

        <Note>
          Las secciones marcadas como Pro son visibles en todos los planes, pero muestran
          una vista de ejemplo con un aviso de actualización hasta que contrates el plan.
        </Note>
      </Section>

      {/* ─ 4.1 Resumen ─ */}
      <Section id="dashboard" title="4.1 Resumen">
        <p>Muestra un panorama en tiempo real del estado del negocio.</p>
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
          <li><strong className="text-white">Tareas pendientes</strong> — crear tu primer programa, agregar tu primer cliente, registrar tu primera transacción</li>
          <li><strong className="text-white">Actividad reciente</strong> — últimas transacciones del sistema</li>
          <li><strong className="text-white">Programas activos</strong> — acceso directo a los programas en curso</li>
          <li><strong className="text-white">URL del portal del cliente</strong> — enlace listo para compartir</li>
          <li><strong className="text-white">Exportación CSV</strong> (solo plan Pro) — descarga el historial completo</li>
        </ul>
        <GuiddeBox>
          <StepList steps={[
            'Ingresar al panel → mostrar las 4 tarjetas de estadísticas',
            'Mostrar la lista de tareas pendientes de configuración',
            'Hacer scroll → mostrar la sección de actividad reciente',
            'Mostrar los programas activos',
            'Señalar la URL del portal del cliente y copiarla',
            '(Plan Pro) Mostrar el botón de exportación CSV',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.2 Registro rápido ─ */}
      <Section id="registro-rapido" title="4.2 Registro rápido">
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

      {/* ─ 4.3 Clientes ─ */}
      <Section id="clientes" title="4.3 Clientes">
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
            'Teléfono (opcional — se rellena con el prefijo de tu Región)',
            'Notas internas (opcional, máx. 500 caracteres — no visibles para el cliente)',
            'Notificaciones por WhatsApp: marca la casilla si el cliente acepta recibir avisos',
            'Clic en Guardar',
          ]} />
          <Note>
            El sistema genera automáticamente un código de acceso único con formato{' '}
            <Code>XXXXX-XXXXX</Code> (10 caracteres, sin letras ni números ambiguos).
            Ese código es el identificador del cliente en el portal — sin contraseña.
          </Note>
          <p>
            Desde la ficha del cliente puedes usar <strong className="text-white">Compartir acceso</strong>{' '}
            para enviarle su enlace personal por WhatsApp, ya con el código incluido.
          </p>
        </SubSection>

        <SubSection id="detalle-cliente" title="Ver detalle de un cliente">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Encabezado:</strong> nombre, estado, código de acceso, teléfono, nivel VIP, fecha, notas, botón activar/desactivar</li>
            <li><strong className="text-white">Inscripciones:</strong> cada programa al que está inscrito, balance actual y total histórico</li>
            <li><strong className="text-white">Vouchers:</strong> código, nombre de recompensa, estado, vencimiento</li>
            <li><strong className="text-white">Misiones:</strong> retos activos del cliente, su avance y el botón +1 progreso (plan Pro)</li>
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
            'Mostrar las secciones: Inscripciones, Vouchers, Misiones, Historial',
            'Clic en Compartir acceso → mostrar el mensaje de WhatsApp con el enlace',
            'Clic en el botón de estado → mostrar el cambio activo/inactivo',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.4 Programas ─ */}
      <Section id="programas" title="4.4 Programas de fidelización">
        <DataTable
          headers={['Tipo', 'Ícono', 'Descripción', 'Config requerida']}
          rows={[
            ['Puntos',   '⭐', 'Acumulan puntos por gasto',            'Puntos por unidad de compra · Mínimo para canjear'],
            ['Sellos',   '🎟️', 'Tarjeta de sellos digital',            'Sellos por tarjeta'],
            ['Visitas',  '📍', 'Recompensa por frecuencia de visitas', 'Visitas necesarias'],
            ['Cashback', '💰', 'Porcentaje de retorno sobre compra',   '% de cashback · Compra mínima (opc.)'],
          ]}
        />
        <Note>Los tipos disponibles dependen de tu plan. Ver sección 7.</Note>

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

        <SubSection id="ofertas-flash" title="Ofertas flash">
          <p>
            Desde el detalle de cada programa puedes activar una{' '}
            <strong className="text-white">oferta flash</strong>: una franja horaria del día en
            la que los clientes acumulan con un multiplicador. Sirve para llenar las horas
            muertas del negocio.
          </p>
          <StepList steps={[
            'Entrar al detalle del programa',
            'Activar la oferta flash',
            'Definir el multiplicador (ej. 2×)',
            'Definir la hora de inicio y la hora de fin',
            'Guardar — el portal del cliente muestra un banner mientras la oferta está viva',
          ]} />
          <Note>Disponible a partir del plan Starter.</Note>
        </SubSection>

        <SubSection id="impulso-inicial" title="Impulso inicial">
          <p>
            Puedes regalar un saldo de arranque al inscribir a un cliente en un programa, para
            que no empiece en cero. Un cliente que ya lleva 2 de 10 sellos regresa más que uno
            con la tarjeta vacía.
          </p>
          <Note>Disponible a partir del plan Starter.</Note>
        </SubSection>

        <SubSection id="misiones" title="Misiones">
          <Note>Disponible únicamente en el plan Pro.</Note>
          <p>
            Una <strong className="text-white">misión</strong> es un reto con premio: el
            cliente tiene que llegar a una meta y al lograrlo recibe un bono. Se crean por
            programa, desde la tarjeta <strong className="text-white">Misiones</strong> del
            detalle del programa.
          </p>
          <StepList steps={[
            'Entrar al detalle del programa → tarjeta Misiones → Nueva misión',
            'Título de la misión (obligatorio, máx. 80 caracteres)',
            '¿Qué debe hacer el cliente? (opcional, máx. 120 caracteres — es lo que él lee)',
            'Meta: cuántas veces tiene que cumplirlo (1 a 999)',
            'Bonus: cuánto se le regala al completarla',
            'Fecha límite (opcional)',
            'Clic en Crear misión',
          ]} />
          <p>
            El bono se expresa en la unidad del programa: puntos, sellos, visitas o bono en
            dinero según el tipo.
          </p>

          <p className="font-medium text-white pt-2">Cómo avanza el progreso</p>
          <p>
            Cada transacción de tipo <strong className="text-white">Ganar</strong> en ese
            programa suma <strong className="text-white">+1</strong> a todas las misiones
            activas del cliente. No tienes que hacer nada: el personal registra la visita
            como siempre y el progreso corre solo.
          </p>
          <p>
            Si necesitas acreditar un avance a mano —el cliente cumplió algo que no pasa por
            caja, por ejemplo— entra a la ficha del cliente, busca la tarjeta{' '}
            <strong className="text-white">Misiones</strong> y usa el botón{' '}
            <strong className="text-white">+1 progreso</strong>.
          </p>

          <p className="font-medium text-white pt-2">Al completarse</p>
          <StepList steps={[
            'La misión se marca como completada y ya no vuelve a contar',
            'El bono se acredita automáticamente como una transacción Ganar, con la nota "Misión completada: [título]"',
            'Al cliente le llega un WhatsApp avisándole (si tiene teléfono y aceptó notificaciones)',
          ]} />

          <Note>
            El cliente ve sus misiones y su barra de progreso en el portal, en la pestaña
            Puntos. Una misión fuera de su ventana de fechas deja de avanzar.
          </Note>
        </SubSection>

        <SubSection id="sorpresa-especial" title="Sorpresa Especial">
          <Note>Disponible únicamente en el plan Pro.</Note>
          <p>
            En cada visita hay una probabilidad de que al cliente le toquen puntos extra sin
            avisar. El cliente no sabe cuándo va a pasar, y eso es justo lo que la hace
            funcionar: convierte cada visita en una tirada.
          </p>
          <StepList steps={[
            'Entrar al detalle del programa → tarjeta Sorpresa Especial',
            'Encender el interruptor',
            'Elegir la probabilidad por visita: 5 %, 10 %, 15 % o 20 %',
            'Elegir el multiplicador: 1.5×, 2× o 3×',
            'Clic en Guardar',
          ]} />
          <p>
            La tarjeta te muestra en vivo qué significan tus opciones — por ejemplo,{' '}
            <strong className="text-white">1 de cada 10 visitas dará 2× puntos</strong>.
          </p>
          <p className="font-medium text-white pt-2">Cuando cae la sorpresa</p>
          <StepList steps={[
            'Lo que el cliente iba a ganar en esa transacción se multiplica',
            'La transacción queda anotada con "🎲 Surprise 2×", así que en el historial se ve por qué el saldo subió de más',
            'Al cliente le llega un WhatsApp avisándole de su suerte',
          ]} />
          <Note>
            En programas de <strong>Sellos</strong> y <strong>Visitas</strong> el multiplicador
            1.5× no aparece: esas unidades son enteras y medio sello no existe.
          </Note>
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Programas → mostrar la lista',
            'Clic en Agregar programa',
            'Nombre: "Programa Puntos Café", tipo: Puntos',
            'Ingresar la configuración de acumulación y el mínimo para canjear',
            'Clic en Crear → mostrar la tarjeta en la lista (estado: Borrador)',
            'Clic en la tarjeta → entrar al detalle',
            'Clic en Activar → mostrar el estado cambiado a "Activo"',
            'Activar una oferta flash de 2× entre las 3 y las 6 pm → guardar',
            'Crear una misión: "Reto del café", meta 5, bonus 100 → mostrarla en la lista',
            'Encender Sorpresa Especial al 10 % y 2× → mostrar la vista previa "1 de cada 10 visitas"',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.5 Recompensas ─ */}
      <Section id="recompensas" title="4.5 Recompensas">
        <Note>
          Disponible a partir del plan Starter. El plan Gratis no incluye catálogo de
          recompensas. Starter permite 3 recompensas <strong>activas</strong> por programa;
          Pro permite 5. Las recompensas desactivadas no cuentan para el límite.
        </Note>

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
          <p>
            El código del voucher tiene formato <Code>XXXX-XXX-XXX</Code> y empieza con
            cuatro letras derivadas del nombre de tu negocio, para que tu personal
            reconozca de un vistazo que el voucher es tuyo.
          </p>
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

      {/* ─ 4.6 Referidos ─ */}
      <Section id="referidos" title="4.6 Referidos">
        <Note>Disponible únicamente en el plan Pro.</Note>
        <p>
          Convierte a tus clientes actuales en promotores: cada uno recibe un código de
          referido de 6 caracteres que puede compartir. Cuando alguien se registra con ese
          código, ambos reciben un bono.
        </p>

        <SubSection id="activar-referidos" title="Activar el programa de referidos">
          <StepList steps={[
            'Ir a Referidos en el menú lateral',
            'Activar el interruptor del programa de referidos',
            'Elegir en qué programas aplica y cuánto se regala a quien refiere y a quien es referido',
            'Guardar',
          ]} />
        </SubSection>

        <SubSection id="referidos-flujo" title="Cómo lo vive el cliente">
          <StepList steps={[
            'El cliente entra a su portal y copia su enlace de referido',
            'Lo comparte por WhatsApp con un conocido',
            'El nuevo cliente abre [tunegocio].fideliza.app/c/refer?code=XXXXXX y se registra',
            'El referido queda en estado "pendiente"',
            'Cuando el nuevo cliente cumple la condición, pasa a "completado" y se acreditan ambos bonos',
          ]} />
        </SubSection>

        <p>
          La pantalla de Referidos muestra cuántos van pendientes, cuántos completados y el
          top 5 de clientes que más refieren.
        </p>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Referidos → mostrar el interruptor apagado',
            'Activarlo → mostrar la configuración de bonos por programa',
            'Guardar',
            'Abrir el portal de un cliente → mostrar su enlace de referido',
            'Volver a Referidos → mostrar las estadísticas de pendientes y completados',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.7 Niveles VIP ─ */}
      <Section id="niveles" title="4.7 Niveles VIP">
        <Note>Disponible únicamente en el plan Pro.</Note>
        <p>
          Un sistema de tres niveles que premia a tus mejores clientes con un multiplicador
          de acumulación. El nivel se calcula de forma <strong className="text-white">universal</strong>:
          suma todas las interacciones del cliente sin importar en qué programa ocurrieron.
        </p>
        <DataTable
          headers={['Nivel', 'Medalla', 'Qué hace']}
          rows={[
            ['Bronce', '🥉', 'Nivel de entrada — todos empiezan aquí'],
            ['Plata',  '🥈', 'Multiplicador de acumulación configurable'],
            ['Oro',    '🥇', 'El multiplicador más alto que definas'],
          ]}
        />
        <p>
          Puedes configurar cuánto puntúa cada tipo de interacción, definir una ventana de
          tiempo (por ejemplo, &quot;solo cuenta lo de los últimos 12 meses&quot;) y una fecha de
          gracia para no degradar a nadie de golpe al activar el sistema.
        </p>
        <p>
          Las tarjetas de cada nivel muestran cuántos clientes tienes en él, y al hacer clic
          te llevan a la lista de clientes filtrada por ese nivel.
        </p>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Niveles VIP → mostrar las tres tarjetas con la distribución actual',
            'Mostrar la configuración de puntaje por tipo de interacción',
            'Ajustar el multiplicador del nivel Oro',
            'Definir la ventana de tiempo en 12 meses',
            'Guardar → hacer clic en la tarjeta de Oro para ver los clientes de ese nivel',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.8 Bonos ─ */}
      <Section id="bonos" title="4.8 Bonos de fidelización">
        <Note>Disponible únicamente en el plan Pro.</Note>
        <p>
          Campañas automáticas que regalan saldo para traer de vuelta al cliente. El bono se
          anuncia por WhatsApp y se acredita cuando el cliente efectivamente vuelve.
        </p>
        <DataTable
          headers={['Campaña', 'Cuándo se dispara']}
          rows={[
            ['Cumpleaños',   'En la fecha de cumpleaños registrada del cliente'],
            ['Reactivación', 'Cuando un cliente lleva tiempo sin volver'],
          ]}
        />
        <p>
          Para cada campaña defines cuántos puntos, sellos o visitas se regalan y cuántos
          días dura el bono antes de vencer.
        </p>
        <Note>
          El bono no se acredita al enviarse: queda reservado y se aplica cuando el cliente
          hace su siguiente visita. La pantalla lista los bonos pendientes por reclamar con
          su fecha de vencimiento.
        </Note>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Bonos → mostrar las dos campañas',
            'Configurar el bono de cumpleaños: 50 puntos, válido 30 días',
            'Configurar el bono de reactivación',
            'Guardar → mostrar la tabla de bonos pendientes por reclamar',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.9 Analíticas ─ */}
      <Section id="analiticas" title="4.9 Analíticas">
        <Note>Disponible únicamente en el plan Pro.</Note>
        <p>Cuatro indicadores de retención más dos gráficas de evolución.</p>
        <DataTable
          headers={['Indicador', 'Qué mide']}
          rows={[
            ['Tasa de retención',          'Qué porcentaje de tus clientes sigue activo'],
            ['Visita promedio / cliente',  'Cuántas veces vuelve en promedio un cliente activo'],
            ['Valor por canje',            'Cuántos puntos gasta en promedio cada canje'],
            ['Clientes en riesgo',         'Cuántos llevan 30 días sin actividad'],
          ]}
        />
        <ul className="list-disc pl-5 space-y-1 pt-2">
          <li><strong className="text-white">Crecimiento de clientes</strong> — inscritos acumulados y transacciones por período</li>
          <li><strong className="text-white">Canjes por período</strong> — cuántas recompensas se canjearon</li>
          <li><strong className="text-white">Mejores clientes</strong> — ranking por puntos de por vida</li>
        </ul>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Analíticas → mostrar las cuatro tarjetas de indicadores',
            'Señalar la flecha de tendencia contra el período anterior',
            'Cambiar el período → mostrar cómo se recalculan las gráficas',
            'Hacer scroll → mostrar el ranking de mejores clientes',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.10 Portal del cliente ─ */}
      <Section id="portal-cliente" title="4.10 Portal del cliente">
        <p>
          Interfaz para el cliente final. Accede sin contraseña usando su código de acceso
          en la URL <Code>[subdominio].fideliza.app/c</Code>.
        </p>
        <Note>
          La URL puede incluir el código directamente: <Code>?code=XXXXX-XXXXX</Code> — es lo
          que se manda con el botón Compartir acceso desde la ficha del cliente.
        </Note>

        <SubSection id="portal-tabs" title="Las 4 pestañas del portal">
          <div className="space-y-3">
            {([
              ['⭐ Puntos',       'Vouchers pendientes · Tarjetas de inscripción con balance, progreso, sellos o contador de visitas · Misiones activas con su barra de avance · Banner de oferta flash cuando está activa'],
              ['🎁 Recompensas', 'Catálogo de recompensas · Barra de progreso · Indicador de puntos suficientes · Botón Canjear'],
              ['📋 Historial',   'Lista de transacciones recientes con ícono, tipo, variación y fecha'],
              ['🏆 Ranking',     'Posición del cliente en el ranking mensual del negocio'],
            ] as [string, string][]).map(([title, desc]) => (
              <div key={title} className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <Note>
          En el plan Gratis el portal funciona, pero se muestra con la marca Fideliza
          (colores por defecto, sin tu logo y con un distintivo &quot;Powered by Fideliza&quot;).
          A partir de Starter el portal usa tu logo y tus colores.
        </Note>

        <GuiddeBox>
          <StepList steps={[
            'Abrir pestaña de incógnito (para simular la vista del cliente)',
            'Navegar a [subdominio].fideliza.app/c',
            'Ingresar un código de acceso válido → mostrar cómo carga el portal',
            'Pestaña Puntos: tarjetas de inscripción y progreso',
            'Pestaña Recompensas: catálogo, barra de progreso, clic en Canjear → voucher generado',
            'Pestaña Historial: lista de transacciones',
            'Pestaña Ranking: posición del cliente en el mes',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.11 Configuración ─ */}
      <Section id="configuracion" title="4.11 Configuración y marca">
        <p>Configuración está dividida en secciones independientes.</p>
        <DataTable
          headers={['Sección', 'Qué configuras']}
          rows={[
            ['Cuenta',           'Nombre del negocio, subdominio y URL del portal (con botones para copiar y abrir)'],
            ['Logo del negocio', 'Sube tu logo y ajústalo con zoom y encuadre. JPG, PNG o WebP · máx. 2 MB'],
            ['Apariencia',       'Color primario y secundario del portal, con vista previa en vivo'],
            ['Región',           'País y prefijo telefónico, zona horaria y moneda'],
            ['Portal del cliente','Mensaje de bienvenida y etiqueta de tu moneda de lealtad'],
            ['Idioma',           'Idioma del panel de control (Español / English)'],
            ['Notificaciones',   'Qué correos quieres recibir'],
            ['WhatsApp',         'Número desde el que salen los mensajes a tus clientes'],
            ['Facturación',      'Plan actual, upgrade y método de pago'],
          ]}
        />

        <SubSection id="config-region" title="Región">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">País / prefijo telefónico</strong> — al agregar un cliente, el campo de teléfono ya trae este prefijo</li>
            <li><strong className="text-white">Zona horaria</strong> — todas las fechas y horas del panel se muestran en esta zona</li>
            <li><strong className="text-white">Moneda</strong> — el símbolo que aparece en los montos de compra de los programas cashback</li>
          </ul>
        </SubSection>

        <SubSection id="config-notificaciones" title="Notificaciones por correo">
          <DataTable
            headers={['Notificación', 'Cuándo llega']}
            rows={[
              ['Nuevo cliente',      'Cuando alguien se registra en tu programa de lealtad'],
              ['Canje de recompensa','Cuando un cliente canjea una recompensa'],
              ['Resumen semanal',    'Cada lunes, con el resumen de actividad de la semana'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Ir a Configuración en el menú',
            'Subir el logo del negocio → ajustar el encuadre con el zoom → Guardar',
            'Cambiar el color primario → mostrar la vista previa en vivo',
            'Escribir mensaje de bienvenida: "¡Gracias por visitarnos!"',
            'Cambiar la etiqueta de moneda a "Estrellas"',
            'Configurar Región: México, +52, zona horaria y moneda',
            'Clic en Guardar cambios',
            'Abrir el portal del cliente en otra pestaña → verificar los cambios aplicados',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.12 Soporte ─ */}
      <Section id="soporte" title="4.12 Soporte">
        <p>
          Desde <Code>/dashboard/soporte</Code> puedes abrir un ticket con el equipo de
          Fideliza sin salir del panel.
        </p>
        <StepList steps={[
          'Ir a Soporte en el menú lateral',
          'En Nuevo ticket, escribir el asunto y el mensaje',
          'Enviar',
          'La respuesta del equipo aparece en el Historial de tickets, debajo de tu mensaje',
        ]} />
        <Note>
          En el plan Pro la sección se llama <strong>Soporte prioritario</strong> y tus tickets
          se atienden antes que el resto.
        </Note>
      </Section>

      {/* ─ 5. WhatsApp ─ */}
      <Section id="whatsapp" title="5. Mensajes por WhatsApp">
        <p>
          Fideliza manda avisos automáticos por WhatsApp a tus clientes. No tienes que
          escribir ni programar nada: los mensajes salen solos cuando ocurre el evento.
        </p>
        <DataTable
          headers={['Aviso', 'Cuándo sale']}
          rows={[
            ['Bienvenida',           'Al registrar al cliente, con su código de acceso'],
            ['Cerca del premio',     'Cuando al cliente le falta poco para canjear'],
            ['Cupón por vencer',     'Antes de que expire un voucher sin canjear'],
            ['Cumpleaños',           'En su cumpleaños, con el bono de regalo (Pro)'],
            ['Racha en riesgo',      'Cuando está por perder su racha de visitas (Pro)'],
            ['Reactivación',         'Cuando lleva tiempo sin volver (Pro)'],
          ]}
        />
        <DataTable
          headers={['Plan', 'Mensajes al mes', 'Mensajes promocionales']}
          rows={[
            ['Gratis',  'No incluye', '✗'],
            ['Starter', '500',        '✗'],
            ['Pro',     '3,000',      '✓'],
          ]}
        />
        <Note>
          Los mensajes salen del número oficial de Fideliza. Poder conectar tu propio número
          de WhatsApp Business está en camino — te avisaremos cuando esté disponible.
        </Note>
        <p>
          Para que un cliente reciba avisos hacen falta dos cosas:{' '}
          <strong className="text-white">teléfono registrado</strong> y la casilla{' '}
          <strong className="text-white">Notificaciones por WhatsApp</strong> marcada en su
          ficha. Esa casilla viene <strong className="text-white">apagada por defecto</strong>:
          es el consentimiento del cliente, no una preferencia tuya, así que hay que pedírselo
          y marcarla al darlo de alta.
        </p>
      </Section>

      {/* ─ 6. Facturación ─ */}
      <Section id="facturacion" title="6. Facturación y planes">
        <p>
          Desde <strong className="text-white">Configuración → Facturación</strong> puedes
          ver tu plan actual, hacer upgrade y administrar el método de pago.
          Los pagos son gestionados por Stripe. <strong className="text-indigo-400 font-bold">Fideliza</strong> no almacena datos de tarjetas.
        </p>
        <Note>
          Si el pago falla o la suscripción se cancela, el sistema aplica las restricciones
          del plan Gratis hasta regularizar el pago. Los datos existentes se conservan.
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

      {/* ─ 7. Planes ─ */}
      <Section id="planes" title="7. Planes y limitaciones">
        <p className="font-medium text-white">Límites</p>
        <DataTable
          headers={['Característica', 'Gratis', 'Starter', 'Pro']}
          rows={[
            ['Clientes máximos',            '50',             'Ilimitado',               'Ilimitado'],
            ['Programas máximos',           '1',              '3',                       'Ilimitado'],
            ['Recompensas activas por programa', 'Sin catálogo', '3',                    '5'],
            ['Tipos de programa',           'Puntos, Sellos', 'Puntos, Sellos, Visitas', 'Puntos, Sellos, Visitas, Cashback'],
            ['Historial de transacciones',  'Últimas 50',     'Ilimitado',               'Ilimitado'],
            ['Mensajes de WhatsApp al mes', 'No incluye',     '500',                     '3,000'],
          ]}
        />

        <p className="font-medium text-white pt-4">Funciones</p>
        <DataTable
          headers={['Función', 'Gratis', 'Starter', 'Pro']}
          rows={[
            ['Portal del cliente',                '✓ (marca Fideliza)', '✓ (tu marca)', '✓ (tu marca)'],
            ['Catálogo de recompensas',           '✗', '✓', '✓'],
            ['Ofertas flash',                     '✗', '✓', '✓'],
            ['Impulso inicial',                   '✗', '✓', '✓'],
            ['WhatsApp promocional',              '✗', '✗', '✓'],
            ['Bonos de cumpleaños y reactivación','✗', '✗', '✓'],
            ['Niveles VIP',                       '✗', '✗', '✓'],
            ['Sorpresa Especial',                 '✗', '✗', '✓'],
            ['Programa de referidos',             '✗', '✗', '✓'],
            ['Misiones',                          '✗', '✗', '✓'],
            ['Analíticas',                        '✗', '✗', '✓'],
            ['Exportación CSV',                   '✗', '✗', '✓'],
            ['Soporte prioritario',               '✗', '✗', '✓'],
          ]}
        />

        <Note>
          Si el pago falla o la suscripción se cancela, el sistema aplica las restricciones
          del plan Gratis. Los datos existentes se conservan.
        </Note>
      </Section>

      {/* ─ 8. Errores ─ */}
      <Section id="errores" title="8. Errores y validaciones">
        <p className="font-medium text-white">Clientes</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Ya existe un cliente con este número de teléfono', 'El teléfono ya está registrado', 'Verificar si el cliente ya existe en la lista'],
            ['Tu plan [X] permite máximo [N] clientes activos', 'Límite del plan alcanzado', 'Desactivar clientes inactivos o actualizar el plan'],
          ]}
        />
        <p className="font-medium text-white mt-4">Programas</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Tu plan [X] permite máximo [N] programas', 'Límite del plan alcanzado', 'Actualizar el plan desde Configuración'],
            ['El tipo "[tipo]" no está disponible en el plan [X]', 'Tipo no incluido en el plan', 'Actualizar el plan'],
            ['La fecha de fin debe ser posterior a la de inicio', 'Fechas invertidas', 'Corregir las fechas'],
          ]}
        />
        <p className="font-medium text-white mt-4">Transacciones</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Cliente no encontrado o inactivo', 'El cliente no existe o está desactivado', 'Verificar el cliente en la lista'],
            ['Programa no encontrado o no activo', 'El programa está pausado o archivado', 'Cambiar estado del programa a Activo'],
            ['El ajuste dejaría un balance negativo', 'El ajuste es mayor que el balance', 'Ingresar un ajuste menor'],
            ['El cliente debe estar inscrito en este programa', 'Cliente no inscrito', 'Inscribir al cliente en el programa'],
          ]}
        />
        <p className="font-medium text-white mt-4">Canjes</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Límite alcanzado: máximo [N] recompensas activas por programa', 'Límite del plan alcanzado', 'Desactivar una recompensa que ya no uses, o actualizar el plan'],
            ['La recompensa está agotada', 'La recompensa agotó su stock', 'Actualizar el stock o desactivar la recompensa'],
            ['[cliente] no tiene suficientes [etiqueta] para canjear', 'Balance insuficiente', 'El cliente debe seguir acumulando'],
            ['Código de canje no encontrado', 'El código de voucher no existe', 'Verificar que el código esté escrito correctamente'],
            ['El voucher ha expirado', 'El voucher venció', 'El cliente debe solicitar uno nuevo'],
            ['El voucher ya no está pendiente', 'El voucher ya fue usado o cancelado', 'El voucher no es válido para canje'],
          ]}
        />
        <p className="font-medium text-white mt-4">Portal del cliente</p>
        <DataTable
          headers={['Error', 'Causa', 'Solución']}
          rows={[
            ['Código no encontrado. Verifícalo e inténtalo de nuevo.', 'El código de acceso es incorrecto', 'Verificar el código en el panel de admin'],
          ]}
        />
        <Note>
          Los textos exactos pueden variar. Lo que importa es la causa: si el mensaje habla
          de un límite, es tu plan; si habla del cliente o del programa, revisa su estado.
        </Note>
      </Section>

      {/* ─ 9. Buenas prácticas ─ */}
      <Section id="buenas-practicas" title="9. Buenas prácticas">
        <div className="space-y-5">
          {([
            ['Configuración inicial', [
              'Sube tu logo y define los colores antes de lanzar el portal. El cliente verá la identidad de tu marca desde el primer acceso.',
              'Escribe un mensaje de bienvenida. Aparece en el portal y mejora la experiencia.',
              'Personaliza la etiqueta de tu moneda: "Estrellas", "Granos", "Millas".',
              'Configura la Región antes de dar de alta clientes: el prefijo telefónico y la zona horaria afectan todo lo demás.',
            ]],
            ['Gestión de programas', [
              'Empieza con un solo programa. Es más fácil de comunicar y escalar.',
              'Usa el estado Borrador para preparar un programa antes de lanzarlo.',
              'No elimines programas. Usa Archivado para mantener el historial.',
              'Usa las ofertas flash para llenar las horas muertas, no las horas pico.',
            ]],
            ['Gestión de clientes', [
              'Captura siempre el teléfono y marca la casilla de notificaciones: sin las dos cosas el cliente no recibe ningún aviso por WhatsApp.',
              'Pide el consentimiento en voz alta al registrarlo ("¿te mando tus puntos por WhatsApp?"). Marcar la casilla sin preguntar es lo que hace que la gente reporte tus mensajes como spam.',
              'Usa notas internas para registrar preferencias especiales.',
              'No desactives clientes sin motivo — perderán acceso al portal.',
              'Usa Compartir acceso para mandarle al cliente su enlace ya con el código incluido.',
            ]],
            ['Recompensas', [
              'Configura stock en recompensas físicas para evitar sobre-emitir.',
              'Usa días de expiración para crear urgencia (ej. 30 días).',
              'Desactiva recompensas en lugar de eliminarlas.',
            ]],
            ['Retención (plan Pro)', [
              'Activa los bonos de reactivación antes que ninguna otra campaña: recuperar un cliente cuesta menos que conseguir uno nuevo.',
              'Captura la fecha de cumpleaños de tus clientes — sin ella el bono de cumpleaños nunca se dispara.',
              'Revisa Analíticas → Clientes en riesgo una vez por semana.',
              'Con las misiones, pon metas que se alcancen en semanas, no en meses: una meta de 20 visitas desmotiva más de lo que motiva.',
              'Empieza la Sorpresa Especial en 10 % y 2×. Si la subes mucho deja de ser sorpresa y se vuelve el precio normal.',
            ]],
            ['Operación diaria', [
              'Usa Registro rápido en tienda para agilizar la atención.',
              'Revisa el Resumen al inicio del día.',
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

      {/* ─ 10. FAQ ─ */}
      <Section id="faq" title="10. Preguntas frecuentes">
        <div className="space-y-4">
          {([
            ['¿Los clientes necesitan instalar una app?',
             'No. El portal es una web que funciona desde cualquier navegador. Sin instalación.'],
            ['¿Cómo recibe el cliente su código de acceso?',
             'Tú se lo entregas al registrarlo. Aparece en la lista de clientes y en su ficha de detalle, y desde ahí puedes mandárselo por WhatsApp con el botón Compartir acceso.'],
            ['¿Puede un cliente perder sus puntos si pierde el código?',
             'No. Puedes buscar al cliente por nombre o teléfono, recuperar su código y compartírselo.'],
            ['¿Se pueden tener varios negocios en una sola cuenta?',
             'No. Cada cuenta está asociada a un único negocio. Para múltiples negocios necesitas cuentas separadas.'],
            ['¿Se pueden eliminar transacciones?',
             'No. El historial es inmutable. Si hay un error, usa una transacción de tipo Ajuste.'],
            ['¿El cliente puede ver datos de otros clientes?',
             'Solo su posición en el ranking mensual. Ningún otro dato de otros clientes es visible.'],
            ['¿Qué son los "vouchers pendientes"?',
             'Recompensas que el cliente ya canjeó desde el portal pero que aún no fueron verificadas físicamente en caja.'],
            ['¿Cuándo expiran los vouchers?',
             'Depende de la configuración de la recompensa. Sin configuración de expiración, el voucher no vence.'],
            ['¿Puedo pausar un programa sin perder datos?',
             'Sí. El estado Pausado detiene nuevas transacciones pero conserva todos los balances e historial.'],
            ['¿Qué pasa si cambio de plan?',
             'Si subes, las funciones quedan disponibles de inmediato. Si bajas (o hay problema de pago), se aplican las restricciones del plan Gratis pero los datos se conservan.'],
            ['¿Tengo que escribir yo los mensajes de WhatsApp?',
             'No. Los avisos son automáticos y salen solos cuando ocurre el evento. Lo único que necesitas es tener el teléfono del cliente registrado.'],
            ['¿Puedo usar mi propio número de WhatsApp?',
             'Todavía no. Hoy los mensajes salen del número oficial de Fideliza. Poder conectar tu propio número de WhatsApp Business está en camino.'],
            ['¿Tengo que ir marcando el avance de las misiones a mano?',
             'No. Cada transacción de tipo Ganar suma +1 a todas las misiones activas de ese programa. El botón "+1 progreso" de la ficha del cliente es solo para casos que no pasan por caja.'],
            ['¿Cuántas misiones puedo tener abiertas a la vez?',
             'No hay límite. Ten en cuenta que un mismo cobro avanza todas las misiones activas de ese programa al mismo tiempo, así que varias misiones simultáneas se completan en paralelo.'],
            ['¿Le aviso yo al cliente cuando completa una misión o cuando le cae una sorpresa?',
             'No. En ambos casos sale un WhatsApp automático, siempre que el cliente tenga teléfono y la casilla de notificaciones marcada.'],
            ['¿Por qué no puedo elegir 1.5× en la Sorpresa Especial?',
             'Porque tu programa es de sellos o de visitas, y esas unidades son enteras. Medio sello no existe. En programas de puntos y cashback el 1.5× sí aparece.'],
            ['¿Cómo sé que un saldo alto fue por una sorpresa y no por un error?',
             'La transacción queda anotada con "🎲 Surprise 2×" en el historial del cliente. Las misiones se anotan como "Misión completada: [título]".'],
            ['¿Por qué veo secciones que no puedo usar?',
             'Referidos, Niveles VIP, Bonos y Analíticas son del plan Pro. Se muestran con datos de ejemplo para que veas de qué se tratan antes de decidir si te sirven.'],
            ['¿En el plan Gratis el portal lleva mi marca?',
             'No. En Gratis el portal usa los colores por defecto de Fideliza y lleva un distintivo "Powered by Fideliza". A partir de Starter aparece con tu logo y tus colores.'],
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
