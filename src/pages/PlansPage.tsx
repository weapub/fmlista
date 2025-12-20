import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plan } from '@/types/database';
import { Check, Info } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useRadioStore } from '@/stores/radioStore';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentRadio } = useRadioStore();

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

  const handleSubscribe = (plan: Plan) => {
    // For now, redirect to WhatsApp or contact
    const message = `Hola, estoy interesado en el ${plan.name} (${plan.type})`;
    const whatsappUrl = `https://wa.me/543704000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const renderPlanSection = (title: string, type: string, description: string) => {
    const filteredPlans = plans.filter(p => p.type === type);
    if (filteredPlans.length === 0) return null;

    return (
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[896px] mx-auto px-4">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:border-secondary-500 transition-all transform hover:-translate-y-1">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-secondary-600">${plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.interval === 'monthly' ? 'mes' : 'año'}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  className="w-full py-3 px-6 bg-secondary-600 text-white rounded-lg font-semibold hover:bg-secondary-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Contratar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-900 to-secondary-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Planes y Servicios</h1>
          <p className="text-xl text-secondary-100">
            Lleva tu radio al siguiente nivel con nuestras soluciones de streaming y publicidad.
          </p>
        </div>
      </div>

      <div className="py-16">
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
      <Footer className={currentRadio ? 'pb-32' : 'pb-8'} />
    </div>
  );
};
