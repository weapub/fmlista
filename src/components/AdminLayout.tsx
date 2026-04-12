import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Radio, 
  Users, 
  BarChart3, 
  LogOut,
  ChevronRight,
  Search
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Radio, label: 'Mis Emisoras', path: '/admin', pattern: /^\/admin(\/profile|\/schedule|$)/ },
    { icon: Users, label: 'Usuarios', path: '/admin' },
    { icon: BarChart3, label: 'Estadísticas', path: '/admin' },
    { icon: Settings, label: 'Configuración', path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f9] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white hidden lg:flex flex-col border-r border-gray-100 sticky top-0 h-screen">
        <div className="p-6 flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-[#696cff] rounded-lg shadow-sm shadow-[#696cff]/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[#566a7f] text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = item.pattern 
              ? item.pattern.test(location.pathname)
              : location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#696cff] text-white shadow-md shadow-[#696cff]/30 font-semibold' 
                    : 'text-[#697a8d] hover:bg-[#f5f5f9]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#697a8d] group-hover:text-[#696cff]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2.5 w-full text-[#ff3e1d] hover:bg-[#ff3e1d]/10 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 h-20 border-b border-gray-100 sticky top-0 z-30 backdrop-blur-sm px-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#566a7f]">{title}</h1>
            {subtitle && <p className="text-xs text-[#a1acb8] uppercase tracking-wider font-semibold">{subtitle}</p>}
          </div>

          {/* Barra de búsqueda moderna */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8] group-focus-within:text-[#696cff] transition-colors" />
              <input 
                type="text"
                placeholder="Buscar en el panel..."
                className="w-full pl-10 pr-4 py-2 bg-[#f5f5f9] border border-transparent rounded-lg focus:bg-white focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-sm placeholder:text-[#b4bdc6]"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-[#566a7f]">Administrador</span>
              <span className="text-xs text-[#a1acb8]">Super Admin</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#696cff] flex items-center justify-center text-white font-bold shadow-sm shadow-[#696cff]/20">
              A
            </div>
          </div>
        </header>

        <main className="p-8 min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};