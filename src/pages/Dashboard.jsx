import { useState, useEffect } from 'react';
import { Package, ClipboardList, Box, FlaskConical, AlertTriangle } from 'lucide-react';
import { materiaService, ordenesService, lotesService } from '../services/produccionService';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMP: 0, ordenesActivas: 0, lotesProducidos: 0,
    liberados: 0, bloqueados: 0, enRevision: 0
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [mp, ordenes, lotes] = await Promise.all([
          materiaService.getAll(),
          ordenesService.getAll(),
          lotesService.getAll()
        ]);
        setStats({
          totalMP: mp.length,
          ordenesActivas: ordenes.filter(o => o.estado !== 'cerrada').length,
          lotesProducidos: lotes.length,
          liberados: lotes.filter(l => l.estadoCalidad === 'liberado').length,
          bloqueados: lotes.filter(l => l.estadoCalidad === 'bloqueado').length,
          enRevision: lotes.filter(l => l.estadoCalidad === 'en_revision').length
        });
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard General</h1>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={22} /></div>
          <div className="stat-info">
            <h3>{stats.totalMP}</h3>
            <p>Materias Primas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><ClipboardList size={22} /></div>
          <div className="stat-info">
            <h3>{stats.ordenesActivas}</h3>
            <p>Órdenes Activas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Box size={22} /></div>
          <div className="stat-info">
            <h3>{stats.lotesProducidos}</h3>
            <p>Lotes Producidos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><FlaskConical size={22} /></div>
          <div className="stat-info">
            <h3>{stats.liberados}</h3>
            <p>Lotes Liberados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <h3>{stats.bloqueados}</h3>
            <p>Lotes Bloqueados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
