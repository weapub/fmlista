import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plan } from '@/types/database';
import { Check, X, Minus, HelpCircle, ChevronDown, ShieldCheck, Zap, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useRadioStore } from '@/stores/radioStore';
import { cn } from '@/lib/utils';
import { AudioPlayer } from '@/components/AudioPlayer';

const PlanCardSkeleton = () => (
  <div className="bg-white rounded-xl p-8 border border-gray-100 animate-pulse flex flex-col h-full shadow-sm">
    <div className="h-6 bg-[#696cff]/10 rounded-full w-3/4 mx-auto mb-4" />
    <div className="h-10 bg-[#696cff]/10 rounded-full w-1/2 mx-auto mb-6" />
    <div className="h-4 bg-slate-50 rounded-full w-full mb-8" />
    <div className="space-y-4 flex-grow mb-10">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#696cff]/10 flex-shrink-0" />
          <div className="h-4 bg-slate-50 rounded-full w-full" />
        </div>
      ))}
    </div>
    <div className="h-12 bg-[#696cff]/10 rounded-lg w-full" />
  </div>
);

const PlanSectionSkeleton = () => (
  <div className="mb-20">
    <div className="border-l-4 border-[#696cff]/20 pl-6 mb-12">
      <div className="h-8 bg-slate-100 rounded-full w-64 mb-2" />
      <div className="h-5 bg-slate-50 rounded-full w-96" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
      {[...Array(3)].map((_, i) => (
        <PlanCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { currentRadio } = useRadioStore();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'payment_error') {
      setErrorNotification('Hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta a nuestro equipo de soporte.');
      // Limpiar URL
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });
      
      let fetchedPlans = data || [];

      // Check if we have microsite plans, if not add mock ones for display
      const hasMicrositePlans = fetchedPlans.some(p => p.type === 'microsite');
      if (!hasMicrositePlans) {
        const mockMicrositePlans: Plan[] = [
          {
            id: 'mock-micro-1',
            name: 'Microsite Básico',
            type: 'microsite',
            price: 2000,
            currency: 'ARS',
            description: 'Mejora la presencia de tu radio con un diseño personalizado básico.',
            features: ['Personalización de colores', 'Banner de cabecera propio', 'Enlaces a redes sociales destacados', 'Soporte por email'],
            interval: 'monthly',
            active: true
          },
          {
            id: 'mock-micro-2',
            name: 'Microsite Profesional',
            type: 'microsite',
            price: 4500,
            currency: 'ARS',
            description: 'Todo lo necesario para una imagen profesional y atractiva.',
            features: ['Todo lo del plan Básico', 'Galería de fotos (hasta 20)', 'Sección de programación semanal', 'Botón de WhatsApp flotante', 'Soporte prioritario'],
            interval: 'monthly',
            active: true
          },
          {
            id: 'mock-micro-3',
            name: 'Microsite Full',
            type: 'microsite',
            price: 8000,
            currency: 'ARS',
            description: 'La experiencia definitiva para tus oyentes con todas las funciones.',
            features: ['Todo lo del plan Profesional', 'Blog de noticias integrado', 'Integración chat en vivo', 'Analytics avanzados de visitas', 'Dominio personalizado (.com.ar)'],
            interval: 'monthly',
            active: true
          }
        ];
        fetchedPlans = [...fetchedPlans, ...mockMicrositePlans];
      }

      // Check for streaming plans
      const hasStreamingPlans = fetchedPlans.some(p => p.type === 'streaming');
      if (!hasStreamingPlans) {
        const mockStreamingPlans: Plan[] = [
          {
            id: 'mock-stream-1',
            name: 'Streaming Audio SD',
            type: 'streaming',
            price: 5000,
            currency: 'ARS',
            description: 'Ideal para comenzar. Calidad estándar y estabilidad.',
            features: ['Calidad 64kbps AAC+', 'Oyentes ilimitados', 'Panel de control Centovacast', 'App genérica incluida'],
            interval: 'monthly',
            active: true
          },
          {
            id: 'mock-stream-2',
            name: 'Streaming Audio HD',
            type: 'streaming',
            price: 8500,
            currency: 'ARS',
            description: 'La mejor calidad de sonido para tus oyentes.',
            features: ['Calidad 128kbps AAC+', 'Oyentes ilimitados', 'Panel de control Centovacast', 'App personalizada Android'],
            interval: 'monthly',
            active: true
          }
        ];
        fetchedPlans = [...fetchedPlans, ...mockStreamingPlans];
      }

      // Check for ads plans
      const hasAdsPlans = fetchedPlans.some(p => p.type === 'ads');
      if (!hasAdsPlans) {
        const mockAdsPlans: Plan[] = [
          {
            id: 'mock-ads-1',
            name: 'Banner Principal',
            type: 'ads',
            price: 15000,
            currency: 'ARS',
            description: 'Máxima visibilidad en la portada de la aplicación.',
            features: ['Ubicación superior en Home', 'Enlace directo a tu web/WhatsApp', 'Estadísticas de clics', 'Diseño de banner incluido'],
            interval: 'monthly',
            active: true
          },
          {
            id: 'mock-ads-2',
            name: 'Radio Destacada',
            type: 'ads',
            price: 10000,
            currency: 'ARS',
            description: 'Aparece primero en las búsquedas y listas.',
            features: ['Posición #1 en tu categoría', 'Distintivo "Destacado"', 'Mayor exposición en sugerencias', 'Reporte mensual de alcance'],
            interval: 'monthly',
            active: true
          }
        ];
        fetchedPlans = [...fetchedPlans, ...mockAdsPlans];
      }
      
      setPlans(fetchedPlans);
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    setProcessingId(plan.id);
    
    try {
      // Lógica de Startup: Llamada a Edge Function para crear preferencia en Mercado Pago
      // El backend se encarga de la seguridad y de devolver el init_point
      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: { planId: plan.id, type: plan.type }
      });

      if (error) throw error;

      if (data?.init_point) {
        window.location.href = data.init_point; // Redirigir al checkout de Mercado Pago
      } else {
        throw new Error('No se pudo generar el link de pago');
      }
    } catch (err) {
      console.error('Error al procesar pago:', err);
      // Fallback a WhatsApp si el sistema automático falla
      const message = `Hola, quiero contratar el plan ${plan.name}. Tuve un problema con el pago automático.`;
      window.open(`https://wa.me/543704000000?text=${encodeURIComponent(message)}`, '_blank');
    } finally {
      setProcessingId(null);
    }
  };

  const renderPlanSection = (title: string, type: string, description: string) => {
    const filteredPlans = plans.filter(p => p.type === type);
    if (filteredPlans.length === 0) return null;

    return (
      <div className="mb-20">
        <div className="text-left mb-12 border-l-4 border-[#696cff] pl-6 transition-colors">
          <h2 className="text-3xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">{title}</h2>
          <p className="text-lg text-[#a1acb8] dark:text-[#7e7e9a] max-w-2xl font-normal">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
          {filteredPlans.map((plan, index) => (
            <div key={plan.id} className={`group relative bg-white dark:bg-[#2b2c40] rounded-xl p-8 transition-all duration-300 hover:shadow-lg border ${index === 1 ? 'border-[#696cff] shadow-md shadow-[#696cff]/10 scale-105 z-10' : 'border-gray-100 dark:border-transparent'}`}>
              {index === 1 && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#696cff] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Recomendado
                </div>
              )}
              <div className="flex flex-col h-full">
                <h3 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-4 text-center">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-6">
                  <span className="text-4xl font-bold text-[#566a7f] dark:text-[#cbcbe2] tracking-tight">${plan.price}</span>
                  <span className="text-[#a1acb8] dark:text-[#7e7e9a] font-normal ml-1 text-sm">/{plan.interval === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-8 leading-relaxed text-center text-sm">{plan.description}</p>
                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="bg-[#696cff]/10 p-1 rounded-full mr-3 group-hover:bg-[#696cff] transition-colors">
                        <Check className="w-3.5 h-3.5 text-[#696cff] group-hover:text-white" />
                      </div>
                      <span className="text-[#697a8d] dark:text-[#a3a4cc] font-normal text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processingId !== null}
                  className={`w-full py-3 px-6 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                    index === 1 
                      ? 'bg-[#696cff] text-white hover:bg-[#5f61e6] shadow-md shadow-[#696cff]/20' 
                      : 'bg-[#696cff]/10 text-[#696cff] hover:bg-[#696cff]/20'
                  } disabled:opacity-50`}
                >
                  {processingId === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    index === 1 ? 'Contratar Ahora' : 'Comenzar con este Plan'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFeatureComparator = () => {
    const micrositePlans = plans.filter(p => p.type === 'microsite');
    if (micrositePlans.length === 0) return null;

    const comparisonFeatures = [
      { name: 'Personalización de colores', basic: true, pro: true, full: true },
      { name: 'Banner de cabecera propio', basic: true, pro: true, full: true },
      { name: 'Redes sociales destacadas', basic: true, pro: true, full: true },
      { name: 'Galería de fotos', basic: 'No', pro: 'Hasta 20', full: 'Ilimitada' },
      { name: 'Programación semanal', basic: false, pro: true, full: true },
      { name: 'Botón de WhatsApp flotante', basic: false, pro: true, full: true },
      { name: 'Soporte técnico', basic: 'Email', pro: 'Prioritario', full: '24/7 VIP' },
      { name: 'Blog de noticias', basic: false, pro: false, full: true },
      { name: 'Integración chat en vivo', basic: false, pro: false, full: true },
      { name: 'Analytics de visitas', basic: false, pro: false, full: true },
      { name: 'Dominio .com.ar', basic: false, pro: false, full: true },
    ];

    return (
      <div className="mt-24 max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Compara las funciones</h2>
          <p className="text-[#a1acb8] dark:text-[#7e7e9a] max-w-2xl mx-auto">
            Analiza en detalle qué incluye cada nivel de personalización para tu emisora.
          </p>
        </div>

        <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f5f9]/50 dark:bg-[#232333]/50">
                  <th className="p-6 text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] uppercase tracking-wider border-b border-gray-100 dark:border-[#444564]">Características</th>
                  <th className="p-6 text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] uppercase tracking-wider border-b border-gray-100 dark:border-[#444564] text-center">Básico</th>
                  <th className="p-6 text-sm font-bold text-[#696cff] uppercase tracking-wider border-b border-gray-100 dark:border-[#444564] text-center bg-[#696cff]/5 dark:bg-[#696cff]/10">Profesional</th>
                  <th className="p-6 text-sm font-bold text-[#566a7f] dark:text-[#cbcbe2] uppercase tracking-wider border-b border-gray-100 dark:border-[#444564] text-center">Full</th>
                </tr>
              </thead>
              <tbody className="text-[#697a8d] dark:text-[#a3a4cc]">
                {comparisonFeatures.map((feature, idx) => (
                  <tr key={idx} className="hover:bg-[#f5f5f9]/30 dark:hover:bg-[#323249] transition-colors">
                    <td className="p-5 border-b border-gray-50 dark:border-[#444564] font-medium text-sm">
                      <div className="flex items-center gap-2">
                        {feature.name}
                        <HelpCircle className="w-3.5 h-3.5 text-[#a1acb8] dark:text-[#7e7e9a] cursor-help" />
                      </div>
                    </td>
                    <td className="p-5 border-b border-gray-50 dark:border-[#444564] text-center">
                      {renderValue(feature.basic)}
                    </td>
                    <td className="p-5 border-b border-gray-50 dark:border-[#444564] text-center bg-[#696cff]/5 dark:bg-[#696cff]/10 font-semibold text-[#696cff]">
                      {renderValue(feature.pro)}
                    </td>
                    <td className="p-5 border-b border-gray-50 dark:border-[#444564] text-center">
                      {renderValue(feature.full)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-8 bg-[#696cff]/10 dark:bg-[#696cff]/20 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#696cff]/20">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-[#696cff] items-center justify-center text-white shrink-0">
              <Zap className="w-6 h-6" />
            </div>
          <div className="text-center md:text-left">
              <h4 className="text-[#696cff] font-bold text-lg">¿Eres una cadena de emisoras?</h4>
              <p className="text-[#697a8d] dark:text-[#a3a4cc] text-sm max-w-md">Ofrecemos planes corporativos con gestión centralizada y descuentos por volumen para grupos mediáticos.</p>
            </div>
          </div>
          <button 
            onClick={() => window.open('https://wa.me/543704000000', '_blank')}
            className="bg-[#696cff] text-white px-8 py-3 rounded-lg font-bold shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6] transition-all whitespace-nowrap"
          >
            Hablar con un Asesor
          </button>
        </div>
      </div>
    );
  };

  const renderFAQ = () => {
    const faqs = [
      {
        question: "¿Cómo activo mi micrositio?",
        answer: "Una vez que elijas tu plan y realices el pago, nos pondremos en contacto contigo para solicitar el logo, portada y el link de streaming de tu radio. El alta definitiva suele realizarse en un plazo de 24 a 48 horas hábiles."
      },
      {
        question: "¿Puedo cambiar de plan en cualquier momento?",
        answer: "Sí, puedes subir o bajar de categoría de plan cuando lo desees. El cambio se verá reflejado de forma inmediata en las funciones disponibles, y el ajuste de precio se aplicará en tu siguiente ciclo de facturación."
      },
      {
        question: "¿El servicio de streaming es compatible con celulares?",
        answer: "¡Totalmente! Todos nuestros servicios de streaming utilizan tecnología AAC+ y MP3 de alta eficiencia, lo que garantiza compatibilidad total con navegadores móviles, apps de radio y sistemas Android/iOS."
      },
      {
        question: "¿Qué métodos de pago aceptan?",
        answer: "Para tu comodidad, aceptamos Transferencias Bancarias, Mercado Pago (incluyendo tarjetas de crédito y débito) y pagos en efectivo a través de redes como RapiPago o PagoFácil."
      },
      {
        question: "¿Hay algún contrato de permanencia mínima?",
        answer: "No, nuestros planes son mensuales y prepagos. Puedes cancelar tu suscripción en cualquier momento sin cargos adicionales ni penalizaciones."
      }
    ];

    return (
      <div className="mt-24 max-w-3xl mx-auto px-4 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Preguntas Frecuentes</h2>
          <p className="text-[#a1acb8] dark:text-[#7e7e9a] font-normal">
            Resolvemos tus dudas sobre nuestros servicios y procesos de contratación.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#2b2c40] rounded-xl border border-gray-100 dark:border-transparent overflow-hidden shadow-sm transition-all duration-200"
            >
              <button
                className="w-full p-5 text-left flex items-center justify-between hover:bg-[#f5f5f9]/50 dark:hover:bg-[#323249] transition-colors group"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              >
                <span className={cn("font-semibold transition-colors", openFaqIndex === idx ? "text-[#696cff]" : "text-[#566a7f] dark:text-[#cbcbe2] group-hover:text-[#696cff]")}>
                  {faq.question}
                </span>
                <ChevronDown className={cn("w-5 h-5 text-[#a1acb8] dark:text-[#7e7e9a] transition-transform duration-300", openFaqIndex === idx && "rotate-180 text-[#696cff]")} />
              </button>
              <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", openFaqIndex === idx ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}>
                <div className="p-5 pt-0 text-[#697a8d] dark:text-[#a3a4cc] text-sm leading-relaxed border-t border-gray-50 dark:border-[#444564] mt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderValue = (val: any) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <Check className="w-5 h-5" />
        </div>
      ) : (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-[#a1acb8] dark:text-[#7e7e9a]">
          <Minus className="w-4 h-4" />
        </div>
      );
    }
    return <span className="text-sm">{val}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f9] dark:bg-[#232333]">
        <Navigation />
        {/* Hero Skeleton */}
        <div className="bg-gradient-to-br from-[#696cff]/80 to-[#5f61e6]/80 py-24 px-4 shadow-lg animate-pulse">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="h-12 bg-white/20 rounded-full w-3/4 mx-auto" />
            <div className="h-6 bg-white/10 rounded-full w-1/2 mx-auto" />
          </div>
        </div>

        <div className="py-16 max-w-6xl mx-auto px-4">
          <PlanSectionSkeleton />
          <PlanSectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f9] dark:bg-[#232333] transition-colors duration-300">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#696cff] via-[#787bff] to-[#5f61e6] text-white py-28 px-4 shadow-lg shadow-[#696cff]/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight italic">POTENCIÁ TU RADIO</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-semibold">
            La plataforma líder de Formosa para streaming profesional, micrositios SaaS y publicidad de alto impacto.
          </p>
        </div>
      </div>

      <div className="py-16 max-w-6xl mx-auto px-4">
        {/* Error Notification de Mercado Pago */}
        {errorNotification && (
          <div className="mb-12 p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl flex items-center gap-4 text-red-800 dark:text-red-400 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold flex-1">{errorNotification}</p>
            <button 
              onClick={() => setErrorNotification(null)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {renderPlanSection(
          "Streaming de Audio y Video",
          "streaming",
          "Alta calidad, estabilidad garantizada y soporte técnico especializado para tu emisora."
        )}
        
        {renderPlanSection(
          "Soluciones Publicitarias",
          "ads",
          "Destaca tu marca o radio en nuestra plataforma y llega a miles de oyentes diarios."
        )}

        {renderPlanSection(
          "Servicios Premium para Radios",
          "premium_feature",
          "Desbloquea funciones avanzadas para tu micrositio, incluyendo gestión propia de publicidad."
        )}

        {renderPlanSection(
          "Mejora tu Micrositio",
          "microsite",
          "Herramientas exclusivas para personalizar y potenciar la página de tu radio dentro de nuestra plataforma."
        )}
      </div>

      {/* Trust Section - Startup Style */}
      <div className="bg-white/50 dark:bg-[#2b2c40]/50 py-12 border-y border-gray-100 dark:border-[#444564] mb-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-around gap-8 opacity-70 grayscale">
          <div className="flex items-center gap-2 font-bold text-[#566a7f] dark:text-[#cbcbe2]">
            <ShieldCheck className="w-6 h-6 text-[#71dd37]" />
            <span>Pagos Seguros via Mercado Pago</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#566a7f] dark:text-[#cbcbe2]">
            < Zap className="w-6 h-6 text-[#696cff]" />
            <span>Activación en menos de 48hs</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#566a7f] dark:text-[#cbcbe2]">
            <CreditCard className="w-6 h-6 text-[#03c3ec]" />
            <span>Todas las tarjetas y transferencias</span>
          </div>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <img src="https://logotipous.com/wp-content/uploads/2019/02/mercado-pago-logo.png" alt="Mercado Pago" className="h-8 object-contain dark:brightness-200" />
        </div>
      </div>

      {renderFeatureComparator()}
      
      {renderFAQ()}

      <Footer className={currentRadio ? 'pb-32' : 'pb-8'} />
      <AudioPlayer />
    </div>
  );
};
