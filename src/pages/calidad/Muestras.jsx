import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Beaker } from 'lucide-react';
import Modal from '../../components/Modal';
import { muestrasService } from '../../services/calidadService';
import { lotesService } from '../../services/produccionService';
import { empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/calidad.css';

export default function Muestras() {
  const [items, setItems] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ loteId: '', fechaMuestreo: '', observaciones: '', responsableId: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [m, l, emp] = await Promise.all([
        muestrasService.getAll(),
        lotesService.getAll(),
        empleadosService.getByRoles(['Analista de Calidad', 'Supervisor de Calidad'])
      ]);
      setItems(m);
      setLotes(l);
      setEmpleados(emp);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ loteId: '', fechaMuestreo: new Date().toISOString().slice(0, 16), observaciones: '', responsableId: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      loteId: item.loteId || '',
      fechaMuestreo: item.fechaMuestreo ? item.fechaMuestreo.slice(0, 16) : '',
      observaciones: item.observaciones || '',
      responsableId: item.responsableId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.loteId) return toast.error('Seleccione el lote a analizar');

    try {
      const lote = lotes.find(l => l.id === form.loteId);
      const emp = empleados.find(em => em.id === form.responsableId);
      const data = {
        ...form,
        loteCodigoLote: lote?.codigoLote || '',
        loteProducto: lote?.productoNombre || '',
        responsableNombre: emp?.nombre || ''
      };

      if (editing) {
        await muestrasService.update(editing.id, data);
        toast.success('Muestra actualizada');
      } else {
        await muestrasService.add(data);
        toast.success('Muestra registrada');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Eliminar esta muestra?')) return;
    try {
      await muestrasService.remove(item.id);
      toast.success('Muestra eliminada');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registro de Muestras</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Muestra
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Beaker size={40} />
              <p>No hay muestras registradas</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Producto</th>
                  <th>Responsable</th>
                  <th>Fecha Muestreo</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.loteCodigoLote}</strong></td>
                    <td>{item.loteProducto}</td>
                    <td>{item.responsableNombre || '-'}</td>
                    <td>{item.fechaMuestreo ? new Date(item.fechaMuestreo).toLocaleString() : '-'}</td>
                    <td>{item.observaciones || '-'}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={16} /></button>
                        <button className="btn-icon danger" onClick={() => handleDelete(item)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Editar Muestra' : 'Registrar Muestra de Lote'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Lote a Analizar *</label>
              <select className="form-control" value={form.loteId} onChange={e => setForm({ ...form, loteId: e.target.value })}>
                <option value="">Seleccionar lote a analizar...</option>
                {lotes.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.codigoLote} — {l.productoNombre} ({l.cantidadProducida} {l.unidadMedida})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha y Hora del Muestreo</label>
                <input type="datetime-local" className="form-control" value={form.fechaMuestreo} onChange={e => setForm({ ...form, fechaMuestreo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Responsable del Muestreo</label>
                <select className="form-control" value={form.responsableId} onChange={e => setForm({ ...form, responsableId: e.target.value })}>
                  <option value="">Seleccionar responsable...</option>
                  {empleados.map(em => (
                    <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-control" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="Notas sobre la toma de muestra..." />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Actualizar' : 'Registrar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
