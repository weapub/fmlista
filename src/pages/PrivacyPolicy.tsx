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

export const PrivacyPolicy: React.FC = () => {
  const canonicalUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/privacidad` : 'https://fmlista.com/privacidad';

  useSeo({
    title: 'Política de Privacidad | FM Lista',
    description:
      'Conoce cómo FM Lista recopila, utiliza y protege los datos personales de oyentes, radios y anunciantes.',
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
            Política de Privacidad
          </h1>
          <p className="mt-4 max-w-3xl text-base text-[#697a8d] dark:text-slate-300">
            Esta política explica qué datos recopilamos, para qué los usamos y qué derechos tienen los
            usuarios de FM Lista.
          </p>
          <p className="mt-3 text-sm font-medium text-[#a1acb8] dark:text-slate-500">
            Última actualización: 16 de abril de 2026
          </p>
        </div>

        <div className="space-y-6">
          <Section title="1. Qué datos recopilamos">
            <p>
              Podemos recopilar datos de registro, contacto, navegación, preferencias, interacciones con el
              reproductor, pagos y configuración de radios dentro de la plataforma.
            </p>
            <p>
              Si usas login con Google o correo electrónico, también podemos almacenar nombre, email, rol y
              la información mínima necesaria para administrar tu acceso.
            </p>
          </Section>

          <Section title="2. Para qué usamos la información">
            <p>Utilizamos los datos para operar la plataforma, gestionar accesos, procesar pagos y brindar soporte.</p>
            <p>
              También los usamos para mejorar la experiencia del usuario, resolver incidencias, prevenir usos
              indebidos y generar estadísticas internas de funcionamiento.
            </p>
          </Section>

          <Section title="3. Compartición de datos">
            <p>
              FM Lista no vende datos personales. Podemos compartir información con proveedores que intervienen
              en la operación del servicio, como Supabase, Vercel, Mercado Pago, Google u otros servicios
              estrictamente necesarios para autenticación, pagos, hosting o analítica técnica.
            </p>
          </Section>

          <Section title="4. Cookies y tecnologías similares">
            <p>
              Podemos usar almacenamiento local, cookies técnicas y mecanismos similares para mantener sesiones,
              recordar preferencias y mejorar el rendimiento del sitio y de los micrositios.
            </p>
          </Section>

          <Section title="5. Seguridad">
            <p>
              Aplicamos medidas razonables para proteger la información. Sin embargo, ningún sistema conectado a
              internet puede garantizar seguridad absoluta.
            </p>
          </Section>

          <Section title="6. Derechos del usuario">
            <p>
              Podés solicitar acceso, rectificación o eliminación de tus datos, según corresponda. También podés
              pedir la baja de tu cuenta o consultar cómo se están tratando tus datos.
            </p>
          </Section>

          <Section title="7. Contacto">
            <p>
              Para consultas sobre privacidad o tratamiento de datos, podés escribir a{' '}
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

export default PrivacyPolicy;
