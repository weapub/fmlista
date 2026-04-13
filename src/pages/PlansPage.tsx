import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Plan } from '@/types/database';
import { Check, X, Minus, HelpCircle, ChevronDown, ShieldCheck, Zap, CreditCard, Loader2, AlertCircle, Calendar, Layout, Megaphone, Radio, Star, Quote, MessageCircle } from 'lucide-react';
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
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState('streaming');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const plansSectionRef = useRef<HTMLDivElement>(null);
  const { currentRadio } = useRadioStore();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'payment_error') {
      setErrorNotification('Hubo un problema al procesar tu pago. Por favor, intenta nuevamente o contacta a nuestro equipo de soporte.');
      // Limpiar URL
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    }

    if (status === 'payment_success') {
      setSuccessNotification('¡Gracias por tu suscripción! Tu pago ha sido procesado con éxito y tu servicio se activará en breve.');
      
      // Efecto de Confeti (Carga dinámica para optimizar rendimiento)
      // @ts-ignore
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#696cff', '#71dd37', '#03c3ec', '#ffab00'],
          zIndex: 1000
        });
      }).catch(err => console.error('Error al cargar confeti:', err));

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
      
      setPlans(data || []);
      setLoading(false);
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    // Mostrar el botón de ayuda proactiva después de 30 segundos
    const timer = setTimeout(() => setShowWhatsApp(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (plansSectionRef.current) {
      plansSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
      window.open(`https://wa.me/543704602028?text=${encodeURIComponent(message)}`, '_blank');
    } finally {
      setProcessingId(null);
    }
  };

  const renderPlanSection = (title: string, type: string, description: string) => {
    const filteredPlans = plans.filter(p => p.type === type && p.interval === billingCycle);
    if (filteredPlans.length === 0) return null;

    return (
      <div className="mb-20">
        <div className="text-left mb-12 border-l-4 border-[#696cff] pl-6 transition-colors">
          <h2 className="text-3xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">{title}</h2>
          <p className="text-lg text-[#a1acb8] dark:text-[#7e7e9a] max-w-2xl font-normal">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
          {filteredPlans.map((plan, index) => (
            <div key={plan.id} className={`group relative bg-white dark:bg-[#2b2c40] rounded-xl p-8 transition-all duration-300 hover:shadow-lg border ${plan.is_featured ? 'border-[#696cff] shadow-md shadow-[#696cff]/10 scale-105 z-10' : 'border-gray-100 dark:border-transparent'}`}>
              {plan.is_featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#696cff] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Recomendado
                </div>
              )}
              {plan.interval === 'yearly' && (
                <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-500/20">
                  {plan.type === 'microsite' ? 'Incluye Dominio' : 'Ahorro 20%'}
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
                  {plan.features.map((feature, idx) => {
                    const isExcluded = feature.startsWith('–') || feature.startsWith('-');
                    const cleanFeature = isExcluded ? feature.substring(1).trim() : feature;
                    
                    return (
                      <li key={idx} className="flex items-start">
                        <div className={cn(
                          "p-1 rounded-full mr-3 transition-colors",
                          isExcluded ? "bg-slate-100 dark:bg-slate-800" : "bg-[#696cff]/10 group-hover:bg-[#696cff]"
                        )}>
                          {isExcluded ? <Minus className="w-3.5 h-3.5 text-slate-400" /> : <Check className="w-3.5 h-3.5 text-[#696cff] group-hover:text-white" />}
                        </div>
                        <span className={cn(
                          "font-normal text-sm",
                          isExcluded ? "text-slate-400 line-through opacity-70" : "text-[#697a8d] dark:text-[#a3a4cc]"
                        )}>{cleanFeature}</span>
                      </li>
                    );
                  })}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processingId !== null}
                  className={`w-full py-3 px-6 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                    plan.is_featured 
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
                    plan.is_featured ? 'Contratar Ahora' : 'Comenzar con este Plan'
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

    // Actualizado para reflejar los nuevos tiers de Micrositios
    const comparisonFeatures = [
      { name: 'Personalización de colores', basic: true, pro: true, full: true },
      { name: 'Banner de cabecera propio', basic: true, pro: true, full: true },
      { name: 'Redes sociales destacadas', basic: true, pro: true, full: true },
      { name: 'Galería de fotos', basic: 'No', pro: 'Hasta 20', full: 'Ilimitada' },
      { name: 'Programación semanal', basic: 'No', pro: true, full: true },
      { name: 'Botón de WhatsApp flotante', basic: 'No', pro: true, full: true },
      { name: 'Soporte técnico', basic: 'Email', pro: 'Prioritario', full: '24/7 VIP' },
      { name: 'Blog de noticias', basic: 'No', pro: 'No', full: true },
      { name: 'Integración chat en vivo', basic: 'No', pro: 'No', full: true },
      { name: 'Analytics de visitas', basic: 'No', pro: 'No', full: true },
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

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent overflow-hidden transition-colors">
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

        {/* Mobile View: Comparison Cards */}
        <div className="md:hidden space-y-4">
          {comparisonFeatures.map((feature, idx) => (
            <div key={idx} className="bg-white dark:bg-[#2b2c40] rounded-xl p-5 border border-gray-100 dark:border-transparent shadow-sm">
              <div className="flex items-center gap-2 mb-5 font-bold text-[#566a7f] dark:text-[#cbcbe2] text-sm leading-tight border-b border-gray-50 dark:border-[#444564] pb-3">
                {feature.name}
                <HelpCircle className="w-3.5 h-3.5 text-[#a1acb8] dark:text-[#7e7e9a]" />
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black text-[#a1acb8] dark:text-[#7e7e9a] uppercase tracking-tighter">Básico</span>
                  <div className="h-10 flex items-center">{renderValue(feature.basic)}</div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-[#696cff]/5 dark:bg-[#696cff]/10 rounded-lg py-3 border border-[#696cff]/10 scale-110 shadow-sm shadow-[#696cff]/5">
                  <span className="text-[9px] font-black text-[#696cff] uppercase tracking-tighter">Profesional</span>
                  <div className="h-10 flex items-center">{renderValue(feature.pro)}</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-black text-[#a1acb8] dark:text-[#7e7e9a] uppercase tracking-tighter">Full</span>
                  <div className="h-10 flex items-center">{renderValue(feature.full)}</div>
                </div>
              </div>
            </div>
          ))}
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
            onClick={() => window.open('https://wa.me/543704602028?text=Hola, quiero información sobre los planes corporativos.', '_blank')}
            className="bg-[#696cff] text-white px-8 py-3 rounded-lg font-bold shadow-md shadow-[#696cff]/20 hover:bg-[#5f61e6] transition-all whitespace-nowrap"
          >
            Hablar con un Asesor
          </button>
        </div>
      </div>
    );
  };

  const renderGuaranteeSection = () => {
    return (
      <div className="mt-16 max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-[#2b2c40] rounded-2xl p-8 md:p-10 border border-emerald-100 dark:border-emerald-900/20 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute -right-8 -bottom-8 opacity-5">
            <ShieldCheck className="w-48 h-48 text-emerald-500" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/30">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-[#566a7f] dark:text-[#cbcbe2] mb-3 uppercase tracking-tighter italic">Garantía de Satisfacción</h3>
              <p className="text-[#697a8d] dark:text-[#a3a4cc] leading-relaxed max-w-2xl">
                Probá nuestro servicio sin riesgos. Si durante los primeros <strong>7 días</strong> considerás que la plataforma no es lo que buscabas, te devolvemos el <strong>100% de tu dinero</strong>. Sin preguntas, sin demoras.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTestimonialsSection = () => {
    const testimonials = [
      {
        name: "Juan Pérez",
        radio: "Director de Radio Formosa",
        text: "Desde que nos unimos a FM Lista, nuestra audiencia online creció un 40%. El micrositio es profesional y muy fácil de usar.",
        stars: 5
      },
      {
        name: "María García",
        radio: "Propietaria de La Voz FM",
        text: "La calidad del streaming es excelente. El soporte técnico siempre responde al toque, algo vital para nosotros.",
        stars: 5
      },
      {
        name: "Roberto Martínez",
        radio: "Gerente de Radio Mix",
        text: "Contratamos el plan de publicidad y los resultados fueron inmediatos. Altamente recomendado para cualquier comercio local.",
        stars: 5
      }
    ];

    return (
      <div className="mt-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-[#a1acb8] dark:text-[#7e7e9a] max-w-2xl mx-auto">
            Radios líderes de toda la provincia confían en nosotros para su presencia digital.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white dark:bg-[#2b2c40] p-8 rounded-2xl border border-gray-100 dark:border-transparent shadow-sm hover:shadow-md transition-all relative">
              <Quote className="absolute top-6 right-8 w-8 h-8 text-[#696cff]/10" />
              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-[#697a8d] dark:text-[#a3a4cc] italic mb-6 leading-relaxed">"{t.text}"</p>
              <div>
                <h4 className="font-bold text-[#566a7f] dark:text-[#cbcbe2]">{t.name}</h4>
                <p className="text-sm text-[#a1acb8] dark:text-[#7e7e9a]">{t.radio}</p>
              </div>
            </div>
          ))}
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

          {/* Billing Toggle Improvement */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className={cn("text-sm font-bold transition-colors", billingCycle === 'monthly' ? "text-white" : "text-white/60")}>Mensual</span>
            <button 
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-7 bg-white/20 rounded-full relative p-1 transition-colors hover:bg-white/30"
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                billingCycle === 'yearly' ? "translate-x-7" : "translate-x-0"
              )} />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-bold transition-colors", billingCycle === 'yearly' ? "text-white" : "text-white/60")}>Anual</span>
              <span className="bg-emerald-400 text-[#1a1a2e] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Ahorra 20%
              </span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mt-12 flex flex-wrap justify-center gap-3" role="tablist">
            {[
              { id: 'streaming', label: 'Streaming', icon: Radio },
              { id: 'microsite', label: 'Micrositios', icon: Layout },
              { id: 'ads', label: 'Publicidad', icon: Megaphone },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black transition-all duration-300 shadow-sm uppercase text-xs tracking-widest outline-none",
                  activeTab === tab.id
                    ? "bg-white text-[#696cff] shadow-xl shadow-[#696cff]/30 -translate-y-1"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                )}
              >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-[#696cff]" : "text-white/60")} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={plansSectionRef} className="py-16 max-w-6xl mx-auto px-4">
        {/* Success Notification */}
        {successNotification && (
          <div className="mb-12 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-center gap-4 text-emerald-800 dark:text-emerald-400 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800/30 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold flex-1">{successNotification}</p>
            <button 
              onClick={() => setSuccessNotification(null)}
              className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

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

        <div id="panel-streaming" role="tabpanel" aria-labelledby="tab-streaming">
          {activeTab === 'streaming' && renderPlanSection(
            "Streaming de Audio y Video",
            "streaming",
            "Alta calidad, estabilidad garantizada y soporte técnico especializado para tu emisora."
          )}
        </div>

        <div id="panel-ads" role="tabpanel" aria-labelledby="tab-ads">
          {activeTab === 'ads' && renderPlanSection(
            "Soluciones Publicitarias",
            "ads",
            "Destaca tu marca o radio en nuestra plataforma y llega a miles de oyentes diarios."
          )}
        </div>

        <div id="panel-microsite" role="tabpanel" aria-labelledby="tab-microsite">
          {activeTab === 'microsite' && (
            <>
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

              {renderFeatureComparator()}

              {renderGuaranteeSection()}
            </>
          )}
        </div>
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
          <img src="https://www.mercadopago.com/org-img/MP3/home/logomp3.gif" alt="Mercado Pago" className="h-8 object-contain dark:brightness-200" onError={(e) => e.currentTarget.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 80%22%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22%23009EDF%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EMercado Pago%3C/text%3E%3C/svg%3E'} />
        </div>
      </div>

      {renderTestimonialsSection()}
      
      {renderFAQ()}

      {/* AFIP Data Fiscal Section */}
      <div className="bg-gradient-to-br from-[#f5f5f9] to-[#e8e8f0] dark:from-[#232333] dark:to-[#1a1b2e] py-16 border-t border-gray-100 dark:border-[#444564] mb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-2">Datos Fiscales - AFIP</h3>
            <p className="text-[#a1acb8] dark:text-[#7e7e9a]">Información tributaria de FM Lista</p>
          </div>

          <div className="bg-white dark:bg-[#2b2c40] rounded-xl shadow-sm border border-gray-100 dark:border-transparent p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-[#566a7f] dark:text-[#cbcbe2] mb-4">Consultar Datos Fiscales</h4>
                <p className="text-[#a1acb8] dark:text-[#7e7e9a] mb-6">
                  Podés verificar nuestros datos fiscales registrados ante AFIP escaneando el código QR o haciendo click en el botón. 
                </p>
                <a 
                  href="http://qr.afip.gob.ar/?qr=SkAn0mZmQWnKsx13JW8l2w,," 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#696cff] text-white px-6 py-3 rounded-lg hover:bg-[#5f61e6] transition-colors font-bold"
                >
                  Ver Datos Fiscales AFIP
                </a>
              </div>

              <div className="flex-shrink-0 bg-white p-4 rounded-lg border border-gray-100 dark:border-[#444564]">
                <a 
                  href="http://qr.afip.gob.ar/?qr=SkAn0mZmQWnKsx13JW8l2w,," 
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Datos Fiscales - AFIP"
                >
                  <img 
                    src="http://www.afip.gob.ar/images/f960/DATAWEB.jpg" 
                    alt="Datos Fiscales AFIP" 
                    className="w-32 h-32 object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-[#a1acb8] dark:text-[#7e7e9a] mt-8">
            Código de Verificación AFIP - Consultas v2.0
          </p>
        </div>
      </div>

      {/* Proactive WhatsApp Help Button */}
      {showWhatsApp && (
        <div className={cn(
          "fixed right-8 z-50 transition-all duration-500 animate-in fade-in slide-in-from-bottom-10",
          currentRadio ? "bottom-28" : "bottom-8"
        )}>
          <button
            onClick={() => window.open('https://wa.me/543704602028?text=Hola, estoy viendo los planes y tengo una duda sobre el servicio.', '_blank')}
            className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
          >
            <div className="absolute -top-14 right-0 bg-white dark:bg-[#2b2c40] text-[#566a7f] dark:text-[#cbcbe2] text-xs font-bold py-2.5 px-4 rounded-xl shadow-xl whitespace-nowrap border border-gray-100 dark:border-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              ¿Necesitas ayuda con los planes? 👋
              <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-white dark:bg-[#2b2c40] rotate-45 border-r border-b border-gray-100 dark:border-transparent" />
            </div>
            <MessageCircle className="w-7 h-7 fill-current" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white dark:border-[#232333] rounded-full animate-pulse" />
          </button>
        </div>
      )}

      <Footer className={currentRadio ? 'pb-32' : 'pb-8'} />
      <AudioPlayer />
    </div>
  );
};
