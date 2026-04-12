import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Radio as RadioType } from '@/types/database';
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye, Radio as RadioIcon, MapPin, Tag, ArrowUpRight, TrendingUp, LayoutDashboard, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse flex items-center justify-between">
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded-full w-24" />
      <div className="h-8 bg-[#696cff]/10 rounded-full w-16" />
    </div>
    <div className="w-12 h-12 bg-slate-50 rounded-lg" />
  </div>
);

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded-full w-32" />
          <div className="h-3 bg-slate-50 rounded-full w-20" />
        </div>
      </div>
    </td>
    <td className="px-8 py-6"><div className="h-6 bg-[#696cff]/5 rounded-full w-16" /></td>
    <td className="px-8 py-6"><div className="h-4 bg-slate-50 rounded-full w-24" /></td>
    <td className="px-8 py-6"><div className="h-6 bg-slate-100 rounded-lg w-20" /></td>
    <td className="px-8 py-6 text-right"><div className="h-10 bg-slate-50 rounded-xl w-24 ml-auto" /></td>
  </tr>
);

export const AdminRadios: React.FC = () => {
  const [radios, setRadios] = useState<RadioType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRadios = async () => {
      const { data } = await supabase.from('radios').select('*').order('name');
      setRadios(data || []);
      setLoading(false);
    };
    fetchRadios();
  }, []);

  // Mock data para el gráfico de actividad
  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
    datasets: [
      {
        fill: true,
        label: 'Oyentes en vivo',
        data: [450, 320, 890, 1200, 1050, 1500, 980],
        borderColor: '#696cff', // Sneat Primary Purple
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f9] flex">
      {/* Sidebar Dashboard */}
      <aside className="w-64 bg-white hidden lg:flex flex-col border-r border-gray-200 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-9 h-9 bg-[#696cff] rounded-lg flex items-center justify-center shadow-md shadow-[#696cff]/30">
            <RadioIcon className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-[#566a7f] tracking-tight">Radio<span className="text-[#696cff]">Hub</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => navigate('/admin')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#697a8d] hover:bg-[#696cff]/10 hover:text-[#696cff] transition-all group font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#696cff] text-white font-medium shadow-md shadow-[#696cff]/20">
            <RadioIcon className="w-5 h-5" /> Radios
          </button>
          <button onClick={() => navigate('/admin/settings')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#697a8d] hover:bg-[#696cff]/10 hover:text-[#696cff] transition-all group font-medium">
            <Settings className="w-5 h-5" /> Ajustes
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md px-8 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#566a7f]">Gestión de Emisoras</h1>
              <p className="text-[#a1acb8] text-sm font-normal">Panel de control de contenidos</p>
            </div>
            <button className="flex items-center justify-center gap-2 bg-[#696cff] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#5f61e6] transition-all shadow-md shadow-[#696cff]/30">
              <Plus className="w-5 h-5" /> Nueva Emisora
            </button>
          </div>
        </header>

        <main className="p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Total Radios', val: radios.length, icon: RadioIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Categorías', val: 12, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Ubicaciones', val: 8, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="text-[#a1acb8] font-medium text-sm">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-[#566a7f] mt-1">{stat.val}</h3>
                  </div>
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gráfico de Actividad - Startup Look */}
          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 h-[400px] animate-pulse">
              <div className="h-6 bg-slate-100 rounded-full w-48 mb-8" />
              <div className="h-full bg-slate-50 rounded-xl" />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 text-[#696cff] mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Métricas en Vivo</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#566a7f]">Actividad de Oyentes</h2>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button className="px-4 py-2 bg-white shadow-sm rounded-xl text-xs font-bold text-slate-900 border border-slate-200/50">Hoy</button>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Semana</button>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Tabla de Radios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar emisora por nombre, dial o ciudad..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-secondary-500/10 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Emisora</th>
                    <th className="px-8 py-5">Frecuencia</th>
                    <th className="px-8 py-5">Ubicación</th>
                    <th className="px-8 py-5">Categoría</th>
                    <th className="px-8 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <>
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                    </>
                  ) : (
                    radios.map((radio) => (
                      <tr key={radio.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex-shrink-0">
                              <img src={radio.logo_url} alt={radio.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-lg group-hover:text-[#696cff] transition-colors">{radio.name}</p>
                              <p className="text-[#a1acb8] text-sm font-medium">ID: {radio.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="bg-[#696cff]/10 text-[#696cff] px-4 py-1.5 rounded-full font-bold text-sm">
                            {radio.frequency}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-bold text-[#566a7f] flex items-center gap-2 mt-4">
                          <MapPin className="w-4 h-4 text-[#a1acb8]" /> {radio.location}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-[#a1acb8] font-bold bg-[#f5f5f9] px-3 py-1 rounded-lg text-sm w-fit">
                            <Tag className="w-3 h-3" /> {radio.category}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-3 text-[#a1acb8] hover:text-[#696cff] hover:bg-[#696cff]/10 rounded-xl transition-all" title="Ver Micrositio">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button className="p-3 text-[#a1acb8] hover:text-[#696cff] hover:bg-[#696cff]/10 rounded-xl transition-all" title="Editar">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button className="p-3 text-[#a1acb8] hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};