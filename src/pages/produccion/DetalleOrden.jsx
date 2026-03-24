import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Package, Cog, Box, Lock, CheckCircle
} from 'lucide-react';
import Modal from '../../components/Modal';
import {
  ordenesService, consumosService, avancesService,
  lotesService, materiaService
} from '../../services/produccionService';
import {
  responsablesService, maquinasService, procesosService
} from '../../services/catalogosService';
import { empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/produccion.css';

export default function DetalleOrden() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [consumos, setConsumos] = useState([]);
  const [avances, setAvances] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConsumo, setShowConsumo] = useState(false);
  const [showAvance, setShowAvance] = useState(false);
  const [showLote, setShowLote] = useState(false);
  const [showCierre, setShowCierre] = useState(false);

  // Forms
  const [fConsumo, setFConsumo] = useState({ materiaPrimaId: '', cantidad: '', responsableId: '' });
  const [fAvance, setFAvance] = useState({ maquinaId: '', procesoId: '', cantidadFabricada: '', horaInicio: '', horaFin: '', responsableId: '' });
  const [fLote, setFLote] = useState({ cantidadProducida: '', responsableId: '' });
  const [fCierre, setFCierre] = useState({ observaciones: '', responsableId: '' });

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const [o, cons, avs, lots, mps, maqs, procs, emp] = await Promise.all([
        ordenesService.getById(id),
        consumosService.getByOrden(id),
        avancesService.getByOrden(id),
        lotesService.getByOrden(id),
        materiaService.getAll(),
        maquinasService.getAll(),
        procesosService.getAll(),
        empleadosService.getByRoles(['Operador de Planta', 'Supervisor de Producción', 'Jefe de Producción'])
      ]);
      setOrden(o);
      setConsumos(cons);
      setAvances(avs);
      setLotes(lots);
      setMaterias(mps);
      setMaquinas(maqs);
      setProcesos(procs);
      setEmpleados(emp);
    } catch (e) {
      toast.error('Error al cargar orden');
    }
    setLoading(false);
  };

  const isCerrada = orden?.estado === 'cerrada';

  /* ── T2: Consumo de Materia Prima ── */
  const handleConsumo = async (e) => {
    e.preventDefault();
    if (!fConsumo.materiaPrimaId) return toast.error('Seleccione materia prima');
    if (!fConsumo.cantidad || Number(fConsumo.cantidad) <= 0) return toast.error('Cantidad inválida');

    try {
      const mp = materias.find(m => m.id === fConsumo.materiaPrimaId);
      const emp = empleados.find(em => em.id === fConsumo.responsableId);
      await consumosService.add({
        ordenId: id,
        materiaPrimaId: fConsumo.materiaPrimaId,
        materiaPrimaNombre: mp?.nombre || '',
        unidadMedida: mp?.unidadMedida || '',
        cantidad: Number(fConsumo.cantidad),
        responsableId: fConsumo.responsableId || '',
        responsableNombre: emp?.nombre || ''
      });
      toast.success('Consumo registrado — stock actualizado');
      setShowConsumo(false);
      setFConsumo({ materiaPrimaId: '', cantidad: '', responsableId: '' });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const removeConsumo = async (consumo) => {
    if (!confirm('¿Eliminar consumo? Se restaurará el stock.')) return;
    try {
      await consumosService.remove(consumo);
      toast.success('Consumo eliminado — stock restaurado');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /* ── T3: Avance de Producción ── */
  const handleAvance = async (e) => {
    e.preventDefault();
    if (!fAvance.maquinaId) return toast.error('Seleccione máquina/área');
    if (!fAvance.procesoId) return toast.error('Seleccione proceso');
    if (!fAvance.cantidadFabricada || Number(fAvance.cantidadFabricada) <= 0) return toast.error('Cantidad inválida');

    try {
      const maq = maquinas.find(m => m.id === fAvance.maquinaId);
      const proc = procesos.find(p => p.id === fAvance.procesoId);
      const emp = empleados.find(em => em.id === fAvance.responsableId);
      await avancesService.add({
        ordenId: id,
        maquinaId: fAvance.maquinaId,
        maquinaNombre: maq?.nombre || '',
        procesoId: fAvance.procesoId,
        procesoNombre: proc?.nombre || '',
        cantidadFabricada: Number(fAvance.cantidadFabricada),
        horaInicio: fAvance.horaInicio,
        horaFin: fAvance.horaFin,
        responsableId: fAvance.responsableId || '',
        responsableNombre: emp?.nombre || ''
      });
      toast.success('Avance registrado');
      setShowAvance(false);
      setFAvance({ maquinaId: '', procesoId: '', cantidadFabricada: '', horaInicio: '', horaFin: '', responsableId: '' });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const removeAvance = async (av) => {
    if (!confirm('¿Eliminar avance?')) return;
    try {
      await avancesService.remove(av.id);
      toast.success('Avance eliminado');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /* ── T4: Lote de Producto Terminado ── */
  const handleLote = async (e) => {
    e.preventDefault();
    if (!fLote.cantidadProducida || Number(fLote.cantidadProducida) <= 0) return toast.error('Cantidad inválida');

    try {
      const emp = empleados.find(em => em.id === fLote.responsableId);
      const result = await lotesService.add({
        ordenId: id,
        productoNombre: orden.productoNombre,
        productoId: orden.productoId,
        unidadMedida: orden.unidadMedida,
        cantidadProducida: Number(fLote.cantidadProducida),
        responsableGeneracionId: fLote.responsableId || '',
        responsableGeneracionNombre: emp?.nombre || ''
      });
      toast.success(`Lote ${result.codigoLote} generado`);
      setShowLote(false);
      setFLote({ cantidadProducida: '', responsableId: '' });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  /* ── T5: Cierre de Orden ── */
  const handleCierre = async (e) => {
    e.preventDefault();
    if (!fCierre.responsableId) return toast.error('Seleccione supervisor que autoriza');

    // Validar control de calidad
    if (lotes.length === 0) {
      return toast.error('No se puede cerrar la orden sin generar lotes de producto');
    }
    const lotesPendientes = lotes.filter(l => l.estadoCalidad === 'en_revision');
    if (lotesPendientes.length > 0) {
      return toast.error(`Falta control de calidad en ${lotesPendientes.length} lote(s)`);
    }

    try {
      const emp = empleados.find(em => em.id === fCierre.responsableId);
      await ordenesService.cerrar(id, fCierre.observaciones, fCierre.responsableId || null, emp?.nombre || '');
      toast.success('Orden cerrada exitosamente');
      setShowCierre(false);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!orden) return <div className="empty-state"><p>Orden no encontrada</p></div>;

  const pct = orden.cantidadPlanificada > 0
    ? Math.min(100, Math.round((orden.cantidadProducida || 0) / orden.cantidadPlanificada * 100)) : 0;

  return (
    <div>
      {/* Nav */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/produccion/ordenes')}>
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className="page-title">Orden — {orden.productoNombre}</h1>
          <span className={`badge ${orden.estado === 'cerrada' ? 'badge-success' : orden.estado === 'en_proceso' ? 'badge-info' : 'badge-warning'}`}>
            {orden.estado === 'cerrada' ? 'Cerrada' : orden.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="orden-detail-grid">
        <div className="orden-info-card">
          <h4>Producto</h4>
          <p>{orden.productoNombre}</p>
        </div>
        <div className="orden-info-card">
          <h4>Fecha</h4>
          <p>{orden.fecha}</p>
        </div>
        <div className="orden-info-card">
          <h4>Planificado</h4>
          <p>{orden.cantidadPlanificada} {orden.unidadMedida}</p>
        </div>
        <div className="orden-info-card">
          <h4>Cant. Producida</h4>
          <p>{orden.cantidadProducida || 0} {orden.unidadMedida}</p>
        </div>
      </div>

      {/* ── T2: Consumos ── */}
      <div className="detail-section">
        <div className="section-title">
          <Package size={18} /> Consumo de Materia Prima (T2)
          {!isCerrada && (
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowConsumo(true)}>
              <Plus size={14} /> Registrar Consumo
            </button>
          )}
        </div>
        <div className="card">
          <div className="table-container">
            {consumos.length === 0 ? (
              <div className="empty-state"><p>Sin consumos registrados</p></div>
            ) : (
              <table>
                <thead>
                  <tr><th>Materia Prima</th><th>Cantidad</th><th>Unidad</th><th>Responsable</th><th>Fecha</th>{!isCerrada && <th>Acc.</th>}</tr>
                </thead>
                <tbody>
                  {consumos.map(c => (
                    <tr key={c.id}>
                      <td>{c.materiaPrimaNombre}</td>
                      <td><strong>{c.cantidad}</strong></td>
                      <td>{c.unidadMedida}</td>
                      <td>{c.responsableNombre || '-'}</td>
                      <td>{c.fecha ? new Date(c.fecha).toLocaleDateString() : '-'}</td>
                      {!isCerrada && (
                        <td><button className="btn-icon danger" onClick={() => removeConsumo(c)}><Trash2 size={14} /></button></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── T3: Avances ── */}
      <div className="detail-section">
        <div className="section-title">
          <Cog size={18} /> Avance de Producción (T3)
          {!isCerrada && consumos.length > 0 && (
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowAvance(true)}>
              <Plus size={14} /> Registrar Avance
            </button>
          )}
        </div>
        {consumos.length === 0 && !isCerrada && (
          <div className="card"><div className="empty-state"><p>Primero registre consumo de materia prima (T2)</p></div></div>
        )}
        {(consumos.length > 0 || isCerrada) && (
          <div className="card">
            <div className="table-container">
              {avances.length === 0 ? (
                <div className="empty-state"><p>Sin avances registrados</p></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Máquina/Área</th><th>Proceso</th><th>Cant. Fabricada</th><th>Responsable</th><th>Inicio</th><th>Fin</th>{!isCerrada && <th>Acc.</th>}</tr>
                  </thead>
                  <tbody>
                    {avances.map(a => (
                      <tr key={a.id}>
                        <td>{a.maquinaNombre}</td>
                        <td>{a.procesoNombre}</td>
                        <td><strong>{a.cantidadFabricada}</strong></td>
                        <td>{a.responsableNombre || '-'}</td>
                        <td>{a.horaInicio || '-'}</td>
                        <td>{a.horaFin || '-'}</td>
                        {!isCerrada && (
                          <td><button className="btn-icon danger" onClick={() => removeAvance(a)}><Trash2 size={14} /></button></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── T4: Lotes ── */}
      <div className="detail-section">
        <div className="section-title">
          <Box size={18} /> Lotes de Producto Terminado (T4)
          {!isCerrada && avances.length > 0 && (
            <button className="btn btn-success btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowLote(true)}>
              <Plus size={14} /> Generar Lote
            </button>
          )}
        </div>
        {avances.length === 0 && !isCerrada && (
          <div className="card"><div className="empty-state"><p>Primero registre avance de producción (T3)</p></div></div>
        )}
        {(avances.length > 0 || isCerrada) && (
          <div className="card">
            <div className="table-container">
              {lotes.length === 0 ? (
                <div className="empty-state"><p>Sin lotes generados</p></div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Código Lote</th><th>Cantidad</th><th>Fecha Producción</th><th>Estado Calidad</th></tr>
                  </thead>
                  <tbody>
                    {lotes.map(l => (
                      <tr key={l.id}>
                        <td><strong>{l.codigoLote}</strong></td>
                        <td>{l.cantidadProducida} {l.unidadMedida}</td>
                        <td>{l.fechaProduccion ? new Date(l.fechaProduccion).toLocaleString() : '-'}</td>
                        <td>
                          <span className={`badge ${l.estadoCalidad === 'liberado' ? 'badge-success' : l.estadoCalidad === 'bloqueado' ? 'badge-danger' : 'badge-warning'}`}>
                            {l.estadoCalidad === 'liberado' ? '✓ Liberado' : l.estadoCalidad === 'bloqueado' ? '⛔ Bloqueado' : '⏳ En Revisión'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── T5: Cierre ── */}
      {!isCerrada && lotes.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <button className="btn btn-warning" onClick={() => setShowCierre(true)}>
            <Lock size={16} /> Cerrar Orden (T5)
          </button>
        </div>
      )}

      {isCerrada && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <CheckCircle size={20} /> <strong>Orden cerrada</strong>
            {orden.observacionesCierre && <span style={{ color: 'var(--text-secondary)', marginLeft: '1rem' }}>Obs: {orden.observacionesCierre}</span>}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showConsumo && (
        <Modal title="Registrar Consumo de Materia Prima" onClose={() => setShowConsumo(false)}>
          <form onSubmit={handleConsumo}>
            <div className="form-group">
              <label>Materia Prima *</label>
              <select className="form-control" value={fConsumo.materiaPrimaId} onChange={e => setFConsumo({ ...fConsumo, materiaPrimaId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {materias.filter(m => m.stock > 0).map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} — Stock: {m.stock} {m.unidadMedida}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad a Consumir *</label>
              <input type="number" className="form-control" value={fConsumo.cantidad} onChange={e => setFConsumo({ ...fConsumo, cantidad: e.target.value })} min="0.01" step="any" />
            </div>
            <div className="form-group">
              <label>Responsable del Consumo *</label>
              <select className="form-control" value={fConsumo.responsableId} onChange={e => setFConsumo({ ...fConsumo, responsableId: e.target.value })} required>
                <option value="">Seleccionar responsable...</option>
                {empleados.map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowConsumo(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Consumo</button>
            </div>
          </form>
        </Modal>
      )}

      {showAvance && (
        <Modal title="Registrar Avance de Producción" onClose={() => setShowAvance(false)}>
          <form onSubmit={handleAvance}>
            <div className="form-group">
              <label>Máquina / Área *</label>
              <select className="form-control" value={fAvance.maquinaId} onChange={e => setFAvance({ ...fAvance, maquinaId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Proceso de Producción *</label>
              <select className="form-control" value={fAvance.procesoId} onChange={e => setFAvance({ ...fAvance, procesoId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {procesos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad Fabricada *</label>
              <input type="number" className="form-control" value={fAvance.cantidadFabricada} onChange={e => setFAvance({ ...fAvance, cantidadFabricada: e.target.value })} min="1" step="any" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hora Inicio</label>
                <input type="time" className="form-control" value={fAvance.horaInicio} onChange={e => setFAvance({ ...fAvance, horaInicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Hora Fin</label>
                <input type="time" className="form-control" value={fAvance.horaFin} onChange={e => setFAvance({ ...fAvance, horaFin: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Responsable del Avance *</label>
              <select className="form-control" value={fAvance.responsableId} onChange={e => setFAvance({ ...fAvance, responsableId: e.target.value })} required>
                <option value="">Seleccionar responsable...</option>
                {empleados.map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAvance(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Registrar Avance</button>
            </div>
          </form>
        </Modal>
      )}

      {showLote && (
        <Modal title="Generar Lote de Producto Terminado" onClose={() => setShowLote(false)}>
          <form onSubmit={handleLote}>
            <div className="form-group">
              <label>Producto</label>
              <input type="text" className="form-control" value={orden.productoNombre} disabled />
            </div>
            <div className="form-group">
              <label>Cantidad Producida *</label>
              <input type="number" className="form-control" value={fLote.cantidadProducida} onChange={e => setFLote({ ...fLote, cantidadProducida: e.target.value })} min="1" step="any" />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              El código de lote se generará automáticamente. El lote iniciará con estado "En Revisión" para control de calidad.
            </p>
            <div className="form-group">
              <label>Responsable que Genera el Lote *</label>
              <select className="form-control" value={fLote.responsableId} onChange={e => setFLote({ ...fLote, responsableId: e.target.value })} required>
                <option value="">Seleccionar responsable...</option>
                {empleados.map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowLote(false)}>Cancelar</button>
              <button type="submit" className="btn btn-success">Generar Lote</button>
            </div>
          </form>
        </Modal>
      )}

      {showCierre && (
        <Modal title="Cerrar Orden de Producción" onClose={() => setShowCierre(false)}>
          <form onSubmit={handleCierre}>
            <div style={{ background: 'var(--warning-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--warning)' }}>
              ⚠️ Una vez cerrada, la orden no podrá ser modificada.
            </div>
            <div className="form-group">
              <label>Cantidad Total Producida</label>
              <input type="text" className="form-control" value={`${orden.cantidadProducida || 0} ${orden.unidadMedida}`} disabled />
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-control" value={fCierre.observaciones} onChange={e => setFCierre({ ...fCierre, observaciones: e.target.value })} placeholder="Diferencias, notas..." />
            </div>
            <div className="form-group">
              <label>Supervisor que Autoriza el Cierre *</label>
              <select className="form-control" value={fCierre.responsableId} onChange={e => setFCierre({ ...fCierre, responsableId: e.target.value })} required>
                <option value="">Seleccionar supervisor...</option>
                {empleados.filter(em => em.rol.includes('Supervisor') || em.rol.includes('Jefe')).map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCierre(false)}>Cancelar</button>
              <button type="submit" className="btn btn-warning">Cerrar Orden</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
