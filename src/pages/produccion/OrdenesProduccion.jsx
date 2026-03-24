import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { ordenesService } from '../../services/produccionService';
import { productosService } from '../../services/catalogosService';
import { empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/produccion.css';

const ESTADOS = {
  pendiente: { label: 'Pendiente', class: 'badge-warning' },
  en_proceso: { label: 'En Proceso', class: 'badge-info' },
  cerrada: { label: 'Cerrada', class: 'badge-success' }
};

export default function OrdenesProduccion() {
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ productoId: '', cantidadPlanificada: '', fecha: '', responsableId: '' });
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ord, prod, emp] = await Promise.all([
        ordenesService.getAll(),
        productosService.getAll(),
        empleadosService.getByRoles(['Jefe de Producción', 'Supervisor de Producción'])
      ]);
      setItems(ord);
      setProductos(prod);
      setEmpleados(emp);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ productoId: '', cantidadPlanificada: '', fecha: new Date().toISOString().split('T')[0], responsableId: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    if (item.estado === 'cerrada') return toast.error('No se puede editar una orden cerrada');
    setEditing(item);
    setForm({
      productoId: item.productoId || '',
      cantidadPlanificada: item.cantidadPlanificada || '',
      fecha: item.fecha || '',
      responsableId: item.responsableId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productoId) return toast.error('Seleccione un producto');
    if (!form.cantidadPlanificada || Number(form.cantidadPlanificada) <= 0) return toast.error('Cantidad planificada inválida');
    if (!form.responsableId) return toast.error('Seleccione un responsable de la orden');

    try {
      const prod = productos.find(p => p.id === form.productoId);
      const emp = empleados.find(em => em.id === form.responsableId);
      const data = {
        ...form,
        cantidadPlanificada: Number(form.cantidadPlanificada),
        productoNombre: prod?.nombre || '',
        unidadMedida: prod?.unidadMedida || '',
        responsableNombre: emp?.nombre || ''
      };

      if (editing) {
        await ordenesService.update(editing.id, data);
        toast.success('Orden actualizada');
      } else {
        await ordenesService.add(data);
        toast.success('Orden creada');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (item.estado !== 'pendiente') return toast.error('Solo se pueden eliminar órdenes pendientes');
    if (!confirm('¿Eliminar esta orden?')) return;
    try {
      await ordenesService.remove(item.id);
      toast.success('Orden eliminada');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Órdenes de Producción</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nueva Orden
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={40} />
              <p>No hay órdenes de producción</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Responsable</th>
                  <th>Cant. Planificada</th>
                  <th>Cant. Producida</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const pct = item.cantidadPlanificada > 0
                    ? Math.min(100, Math.round((item.cantidadProducida || 0) / item.cantidadPlanificada * 100))
                    : 0;
                  const est = ESTADOS[item.estado] || ESTADOS.pendiente;
                  return (
                    <tr key={item.id}>
                      <td>{item.fecha}</td>
                      <td><strong>{item.productoNombre}</strong></td>
                      <td>{item.responsableNombre || '-'}</td>
                      <td>{item.cantidadPlanificada} {item.unidadMedida}</td>
                      <td>{item.cantidadProducida || 0} {item.unidadMedida}</td>
                      <td><span className={`badge ${est.class}`}>{est.label}</span></td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-icon" onClick={() => navigate(`/produccion/orden/${item.id}`)} title="Ver Detalle">
                            <Eye size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => openEdit(item)} title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon danger" onClick={() => handleDelete(item)} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Editar Orden' : 'Nueva Orden de Producción'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Producto a Fabricar *</label>
              <select className="form-control" value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })}>
                <option value="">Seleccionar producto...</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.unidadMedida})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad Planificada *</label>
                <input type="number" className="form-control" value={form.cantidadPlanificada} onChange={e => setForm({ ...form, cantidadPlanificada: e.target.value })} min="1" step="any" />
              </div>
              <div className="form-group">
                <label>Fecha *</label>
                <input type="date" className="form-control" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Responsable de la Orden *</label>
              <select className="form-control" value={form.responsableId} onChange={e => setForm({ ...form, responsableId: e.target.value })} required>
                <option value="">Seleccionar responsable...</option>
                {empleados.map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Actualizar' : 'Crear Orden'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
