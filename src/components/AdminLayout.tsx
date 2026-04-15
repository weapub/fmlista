import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Radio,
  Users,
  CreditCard,
  History,
  Megaphone,
  LogOut,
  ChevronRight,
  Search,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { ROLES } from '@/types/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  pattern: RegExp;
  superAdminOnly?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', pattern: /^\/admin$/ },
    { icon: Radio, label: 'Mis Emisoras', path: '/admin', pattern: /^\/admin(\/profile|\/schedule|$)/ },
    { icon: History, label: 'Historial de Pagos', path: '/admin/payments', pattern: /^\/admin\/payments$/ },
    { icon: Megaphone, label: 'Anuncios', path: '/admin/anuncios', pattern: /^\/admin\/anuncios(\/.*)?$/ },
    { icon: CreditCard, label: 'Gestion de Cobros', path: '/admin/billing', pattern: /^\/admin\/billing$/, superAdminOnly: true },
    { icon: Users, label: 'Usuarios', path: '/admin/users', pattern: /^\/admin\/users$/, superAdminOnly: true },
    { icon: Settings, label: 'Planes', path: '/admin/planes', pattern: /^\/admin\/planes$/, superAdminOnly: true },
    { icon: Settings, label: 'Configuracion', path: '/admin/settings', pattern: /^\/admin\/settings$/, superAdminOnly: true },
  ];

  const visibleMenuItems = menuItems.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const displayName = user?.email?.split('@')[0] || 'Administrador';
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Radio Admin';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'A';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f9] dark:bg-[#232333] flex transition-colors duration-300">
      <aside className="w-64 bg-white dark:bg-[#2b2c40] hidden lg:flex flex-col border-r border-gray-100 dark:border-transparent sticky top-0 h-screen transition-colors duration-300">
        <div className="p-6 flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-[#696cff] rounded-lg shadow-sm shadow-[#696cff]/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[#566a7f] dark:text-[#cbcbe2] text-xl">Admin Panel</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {visibleMenuItems.map((item) => {
            const isActive = item.pattern.test(location.pathname);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#696cff] text-white shadow-md shadow-[#696cff]/30 font-semibold'
                    : 'text-[#697a8d] dark:text-[#a3a4cc] hover:bg-[#f5f5f9] dark:hover:bg-[#323249]'
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

        <div className="p-4 border-t border-gray-100 dark:border-[#444564]">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2.5 w-full text-[#ff3e1d] hover:bg-[#ff3e1d]/10 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 dark:bg-[#2b2c40]/80 h-20 border-b border-gray-100 dark:border-transparent sticky top-0 z-30 backdrop-blur-sm px-8 flex items-center justify-between transition-colors duration-300">
          <div>
            <h1 className="text-xl font-bold text-[#566a7f] dark:text-[#cbcbe2]">{title}</h1>
            {subtitle && <p className="text-xs text-[#a1acb8] dark:text-[#7e7e9a] uppercase tracking-wider font-semibold">{subtitle}</p>}
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1acb8] dark:text-[#7e7e9a] group-focus-within:text-[#696cff] transition-colors" />
              <input
                type="text"
                placeholder="Buscar en el panel..."
                className="w-full pl-10 pr-4 py-2 bg-[#f5f5f9] dark:bg-[#232333] border border-transparent dark:border-transparent rounded-lg focus:bg-white dark:focus:bg-[#323249] focus:border-[#696cff] focus:ring-[0.25rem] focus:ring-[#696cff]/10 transition-all outline-none text-sm text-[#566a7f] dark:text-[#cbcbe2] placeholder:text-[#b4bdc6] dark:placeholder:text-[#4e4e6a]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg text-[#697a8d] dark:text-[#a3a4cc] hover:bg-gray-100 dark:hover:bg-[#323249] transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-[#566a7f] dark:text-[#cbcbe2]">{displayName}</span>
              <span className="text-xs text-[#a1acb8] dark:text-[#7e7e9a]">{roleLabel}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#696cff] flex items-center justify-center text-white font-bold shadow-sm shadow-[#696cff]/20">
              {avatarInitial}
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
