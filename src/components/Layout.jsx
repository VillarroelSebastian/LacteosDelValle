import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Factory, FlaskConical, Settings,
  Package, ClipboardList, Cog, TestTubes, FileCheck,
  Beaker, Menu, X, Milk, Box, Users, GraduationCap,
  ClipboardCheck, DollarSign, FileText
} from 'lucide-react';
import '../styles/layout.css';

const nav = [
  { section: 'General' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/catalogos', icon: Settings, label: 'Catálogos' },
  { section: 'Producción' },
  { to: '/produccion/materia-prima', icon: Package, label: 'Materia Prima' },
  { to: '/produccion/ordenes', icon: ClipboardList, label: 'Órdenes de Producción' },
  { to: '/produccion/producto-terminado', icon: Box, label: 'Producto Terminado' },
  { section: 'Calidad' },
  { to: '/calidad/dashboard', icon: FlaskConical, label: 'Dashboard Calidad' },
  { to: '/calidad/muestras', icon: Beaker, label: 'Muestras' },
  { to: '/calidad/resultados', icon: TestTubes, label: 'Resultados Lab' },
  { to: '/calidad/validacion', icon: FileCheck, label: 'Validación' },
  { section: 'Recursos Humanos' },
  { to: '/rrhh/empleados', icon: Users, label: 'Empleados' },
  { to: '/rrhh/capacitaciones', icon: GraduationCap, label: 'Capacitaciones' },
  { to: '/rrhh/evaluaciones', icon: ClipboardCheck, label: 'Evaluaciones' },
  { to: '/rrhh/nomina', icon: DollarSign, label: 'Nómina' },
  { to: '/rrhh/documentacion', icon: FileText, label: 'Documentación' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const flat = nav.filter(n => n.to);
    const match = flat.find(n => n.to === location.pathname) ||
                  flat.find(n => location.pathname.startsWith(n.to) && n.to !== '/');
    return match ? match.label : 'Lacteos del Valle';
  };

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Milk size={20} /></div>
          <div>
            <h1>Lacteos del Valle</h1>
            <span>Sistema de Gestión</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <item.icon size={18} /> {item.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="topbar-title">
            <strong>{getPageTitle()}</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-dot"></span>
            Lacteos del Valle
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
