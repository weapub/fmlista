import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useSeo } from '@/hooks/useSeo';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
    <h2 className="mb-4 text-xl font-bold text-[#566a7f] dark:text-white">{title}</h2>
    <div className="space-y-4 text-sm leading-7 text-[#697a8d] dark:text-slate-300">{children}</div>
  </section>
);

export const TermsAndConditions: React.FC = () => {
  const canonicalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/terminos` : 'https://www.fmlista.com.ar/terminos';

  useSeo({
    title: 'Términos y Condiciones | FM Lista',
    description:
      'Lee los términos y condiciones que regulan el uso de FM Lista, sus micrositios, planes y servicios asociados.',
    url: canonicalUrl,
    image: '/apple-touch-icon.png',
    siteName: 'FM Lista',
  });

  return (
    <div className="min-h-screen bg-[#f5f5f9] transition-colors dark:bg-slate-950">
      <Navigation />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#696cff]">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-[#566a7f] dark:text-white sm:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-4 max-w-3xl text-base text-[#697a8d] dark:text-slate-300">
            Estos términos regulan el acceso y uso de FM Lista, incluyendo la contratación de planes, micrositios,
            streaming, publicidad y herramientas administrativas.
          </p>
          <p className="mt-3 text-sm font-medium text-[#a1acb8] dark:text-slate-500">
            Última actualización: 16 de abril de 2026
          </p>
        </div>

        <div className="space-y-6">
          <Section title="1. Aceptación">
            <p>
              Al acceder, registrarte o utilizar FM Lista, aceptás estos términos y condiciones. Si no estás de
              acuerdo, no debes utilizar la plataforma.
            </p>
          </Section>

          <Section title="2. Uso permitido">
            <p>
              El usuario se compromete a utilizar el servicio de forma lícita, sin afectar la disponibilidad,
              integridad o reputación de la plataforma ni de terceros.
            </p>
          </Section>

          <Section title="3. Cuentas y acceso">
            <p>
              Cada usuario es responsable por la confidencialidad de sus credenciales y por toda actividad
              realizada desde su cuenta.
            </p>
            <p>
              FM Lista puede suspender accesos en caso de uso abusivo, fraude, incumplimiento contractual o
              riesgos para la seguridad de la plataforma.
            </p>
          </Section>

          <Section title="4. Planes, pagos y renovaciones">
            <p>
              Los planes y precios publicados pueden actualizarse. Los pagos pueden ser procesados por terceros
              como Mercado Pago u otros proveedores integrados.
            </p>
            <p>
              La activación de servicios puede depender de validaciones técnicas, confirmación del pago y
              configuración correcta de los datos de la emisora.
            </p>
          </Section>

          <Section title="5. Contenido de radios y anunciantes">
            <p>
              Cada radio, anunciante o administrador es responsable por el contenido que publica, transmite o
              enlaza dentro de FM Lista.
            </p>
            <p>
              No se permite contenido ilícito, engañoso, difamatorio, fraudulento o que infrinja derechos de
              terceros.
            </p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>
              FM Lista procura mantener la plataforma operativa, pero no garantiza disponibilidad continua ni
              ausencia total de errores, interrupciones o incompatibilidades externas.
            </p>
          </Section>

          <Section title="7. Propiedad intelectual">
            <p>
              La marca, diseño, software, estructura y elementos propios de FM Lista están protegidos por derechos
              aplicables. El usuario no adquiere propiedad sobre la plataforma por el simple uso del servicio.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              En la máxima medida permitida por ley, FM Lista no será responsable por daños indirectos, lucro
              cesante, pérdida de datos o interrupciones atribuibles a terceros, redes, navegadores, proveedores
              externos o contenido de usuarios.
            </p>
          </Section>

          <Section title="9. Modificaciones">
            <p>
              Podemos actualizar estos términos cuando sea necesario. La versión vigente será la publicada en el
              sitio.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Para consultas legales o contractuales, podés escribir a{' '}
              <a className="font-semibold text-[#696cff]" href="mailto:soporte@fmlista.com">
                soporte@fmlista.com
              </a>
              .
            </p>
          </Section>
        </div>
      </main>

      <Footer className="pb-8" />
    </div>
  );
};

export default TermsAndConditions;
