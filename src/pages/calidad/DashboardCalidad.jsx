import { useState, useEffect } from 'react';
import { FlaskConical, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { lotesService } from '../../services/produccionService';
import { validacionesService } from '../../services/calidadService';
import toast from 'react-hot-toast';
import '../../styles/calidad.css';

export default function DashboardCalidad() {
  const [lotes, setLotes] = useState([]);
  const [validaciones, setValidaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [l, v] = await Promise.all([
          lotesService.getAll(),
          validacionesService.getAll()
        ]);
        setLotes(l);
        setValidaciones(v);
      } catch (e) {
        toast.error('Error al cargar');
      }
      setLoading(false);
    };
    load();
  }, []);

  const liberados = lotes.filter(l => l.estadoCalidad === 'liberado');
  const bloqueados = lotes.filter(l => l.estadoCalidad === 'bloqueado');
  const enRevision = lotes.filter(l => l.estadoCalidad === 'en_revision');

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard de Calidad</h1>
      </div>

      {/* Summary */}
      <div className="calidad-summary">
        <div className="calidad-stat total">
          <span className="num">{lotes.length}</span>
          <span className="label">Total Lotes</span>
        </div>
        <div className="calidad-stat liberado">
          <span className="num">{liberados.length}</span>
          <span className="label">Liberados</span>
        </div>
        <div className="calidad-stat revision">
          <span className="num">{enRevision.length}</span>
          <span className="label">En Revisión</span>
        </div>
        <div className="calidad-stat bloqueado">
          <span className="num">{bloqueados.length}</span>
          <span className="label">Bloqueados</span>
        </div>
      </div>

      {/* Alerts */}
      {bloqueados.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ color: 'var(--danger)' }}>
            <span><AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />Alertas — Lotes Bloqueados</span>
          </div>
          <div className="card-body">
            <div className="alert-list">
              {bloqueados.map(l => (
                <div className="alert-item" key={l.id}>
                  <XCircle size={20} />
                  <div className="alert-text">
                    <strong>Lote {l.codigoLote} — {l.productoNombre}</strong>
                    <span>
                      {l.cantidadProducida} {l.unidadMedida} • Bloqueado
                      {l.fechaValidacion && ` el ${new Date(l.fechaValidacion).toLocaleDateString()}`}
                      {l.responsableCalidadNombre && ` por ${l.responsableCalidadNombre}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lotes en revisión */}
      {enRevision.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span><Clock size={16} style={{ marginRight: '0.5rem' }} />Lotes Pendientes de Validación</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Código Lote</th><th>Producto</th><th>Cantidad</th><th>Fecha Producción</th></tr>
              </thead>
              <tbody>
                {enRevision.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.codigoLote}</strong></td>
                    <td>{l.productoNombre}</td>
                    <td>{l.cantidadProducida} {l.unidadMedida}</td>
                    <td>{l.fechaProduccion ? new Date(l.fechaProduccion).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent validations */}
      {validaciones.length > 0 && (
        <div className="card">
          <div className="card-header">Últimas Validaciones</div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Fecha</th><th>Estado</th><th>Responsable</th><th>Detalles</th></tr>
              </thead>
              <tbody>
                {validaciones.slice(0, 10).map(v => (
                  <tr key={v.id}>
                    <td>{v.fecha ? new Date(v.fecha).toLocaleString() : '-'}</td>
                    <td>
                      <span className={`badge ${v.estado === 'liberado' ? 'badge-success' : 'badge-danger'}`}>
                        {v.estado === 'liberado' ? '✓ Liberado' : '⛔ Bloqueado'}
                      </span>
                    </td>
                    <td>{v.responsableNombre}</td>
                    <td>
                      {v.detalles?.map((d, i) => (
                        <span key={i} className={`badge ${d.cumple ? 'badge-success' : 'badge-danger'}`} style={{ marginRight: '0.25rem' }}>
                          {d.tipoPrueba}: {d.valor}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
