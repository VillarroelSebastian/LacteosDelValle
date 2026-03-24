import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Catalogos from './pages/admin/Catalogos';
import MateriaPrima from './pages/produccion/MateriaPrima';
import OrdenesProduccion from './pages/produccion/OrdenesProduccion';
import DetalleOrden from './pages/produccion/DetalleOrden';
import ProductoTerminado from './pages/produccion/ProductoTerminado';
import DashboardCalidad from './pages/calidad/DashboardCalidad';
import Muestras from './pages/calidad/Muestras';
import ResultadosLab from './pages/calidad/ResultadosLab';
import ValidacionCalidad from './pages/calidad/ValidacionCalidad';
import Empleados from './pages/rrhh/Empleados';
import Capacitaciones from './pages/rrhh/Capacitaciones';
import Evaluaciones from './pages/rrhh/Evaluaciones';
import Nomina from './pages/rrhh/Nomina';
import Documentacion from './pages/rrhh/Documentacion';
import './styles/global.css';

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '0.875rem' } }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalogos" element={<Catalogos />} />
          <Route path="/produccion/materia-prima" element={<MateriaPrima />} />
          <Route path="/produccion/ordenes" element={<OrdenesProduccion />} />
          <Route path="/produccion/orden/:id" element={<DetalleOrden />} />
          <Route path="/produccion/producto-terminado" element={<ProductoTerminado />} />
          <Route path="/calidad/dashboard" element={<DashboardCalidad />} />
          <Route path="/calidad/muestras" element={<Muestras />} />
          <Route path="/calidad/resultados" element={<ResultadosLab />} />
          <Route path="/calidad/validacion" element={<ValidacionCalidad />} />
          <Route path="/rrhh/empleados" element={<Empleados />} />
          <Route path="/rrhh/capacitaciones" element={<Capacitaciones />} />
          <Route path="/rrhh/evaluaciones" element={<Evaluaciones />} />
          <Route path="/rrhh/nomina" element={<Nomina />} />
          <Route path="/rrhh/documentacion" element={<Documentacion />} />
        </Route>
      </Routes>
    </>
  );
}
