import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  GraduationCap,
  LogOut, 
  Shield,
  Users,
  Menu,
  X
} from 'lucide-react';
import logo from '../assets/images/logo-transparent.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || (path === '/diplomas' && location.pathname.startsWith('/diplomas'));
  const dashboardPath = user?.role === 'verifier' ? '/verifier' : '/dashboard';

  // Menu Component to avoid repetition
  const NavLinks = () => (
    <>
      <Link
        to={dashboardPath}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive('/dashboard') || isActive('/verifier')
            ? 'bg-[#0f6f75] text-white shadow-sm'
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Home className={`mr-3 h-5 w-5 ${isActive('/dashboard') || isActive('/verifier') ? 'text-white' : 'text-gray-400'}`} />
        Dashboard
      </Link>
      
      <Link
        to="/diplomas"
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive('/diplomas')
            ? 'bg-[#0f6f75] text-white shadow-sm'
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
      >
        <GraduationCap className={`mr-3 h-5 w-5 ${isActive('/diplomas') ? 'text-white' : 'text-gray-400'}`} />
        Diplômes
      </Link>
      
      {user?.role !== 'verifier' && user?.role !== 'student' && (
        <Link
          to="/create"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive('/create')
              ? 'bg-[#0f6f75] text-white shadow-sm'
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Shield className={`mr-3 h-5 w-5 ${isActive('/create') ? 'text-white' : 'text-gray-400'}`} />
          Créer diplôme
        </Link>
      )}
      
      {/* Simulation lien Utilisateurs */}
      {user?.role !== 'verifier' && user?.role !== 'student' && (
        <Link
          to="/users"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive('/users')
              ? 'bg-[#0f6f75] text-white shadow-sm'
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Users className={`mr-3 h-5 w-5 ${isActive('/users') ? 'text-white' : 'text-gray-400'}`} />
          Utilisateurs
        </Link>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      {user && (
        <aside className="w-[280px] bg-[#081D2F] border-r border-[#081D2F] flex-col justify-between hidden md:flex shrink-0">
          <div>
            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-white/10">
               <Link to={dashboardPath} className="flex items-center gap-3">
                 <img src={logo} alt="CertChain Logo" className="h-[64px] w-auto object-contain scale-110 origin-left" />
               </Link>
            </div>
            
            {/* Navigation */}
            <div className="px-4 py-8">
              <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Principal</p>
              <nav className="space-y-1.5">
                <NavLinks />
              </nav>
            </div>
          </div>
          
          {/* Logout Button */}
          <div className="p-4 border-t border-white/10 mb-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Déconnexion
            </button>
          </div>
        </aside>
      )}

      {/* Main Content View */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Mobile Header */}
        {user && (
          <header className="h-20 bg-[#081D2F] border-b border-white/10 flex items-center justify-between px-4 md:hidden shrink-0">
             <Link to={dashboardPath} className="flex items-center gap-2">
                 <img src={logo} alt="CertChain Logo" className="h-[60px] w-auto object-contain scale-110 origin-left" />
             </Link>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
                {mobileMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
             </button>
          </header>
        )}

        {/* Mobile Sidebar Dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden bg-[#081D2F] border-b border-white/10 px-4 py-4 shrink-0 absolute top-20 left-0 right-0 z-50 shadow-lg">
            <nav className="space-y-2 mb-4">
              <NavLinks />
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Déconnexion
            </button>
          </div>
        )}

        {/* Desktop Topbar Header */}
        {user && (
          <header className="h-[80px] bg-white border-b border-gray-200 flex items-center justify-end px-8 shrink-0 hidden md:flex">
            <div className="flex items-center space-x-3 bg-slate-50 border border-gray-200 rounded-full px-5 py-2.5 shadow-sm hover:shadow hover:bg-white transition-all cursor-pointer">
              <div className="h-8 w-8 bg-[#0f6f75] rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.role === 'admin' || user.role === 'super_admin' ? 'AD' : user.role === 'verifier' ? 'VE' : 'US'}
              </div>
              <span className="text-sm font-bold text-[#081D2F]">{user.email}</span>
            </div>
          </header>
        )}
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
