import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import Modal from '../../components/Modal';
import { nominaService, empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/rrhh.css';

export default function Nomina() {
  const [items, setItems] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ empleadoId: '', periodo: '', sueldoBase: '', bonos: '', descuentos: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [n, e] = await Promise.all([
        nominaService.getAll(),
        empleadosService.getAll()
      ]);
      setItems(n);
      setEmpleados(e);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ empleadoId: '', periodo: '', sueldoBase: '', bonos: '0', descuentos: '0' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      empleadoId: item.empleadoId || '',
      periodo: item.periodo || '',
      sueldoBase: item.sueldoBase || '',
      bonos: item.bonos || '0',
      descuentos: item.descuentos || '0'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.empleadoId) return toast.error('Seleccione un empleado');
    if (!form.periodo.trim()) return toast.error('Periodo es obligatorio');
    if (!form.sueldoBase || Number(form.sueldoBase) <= 0) return toast.error('Sueldo base inválido');

    try {
      const emp = empleados.find(em => em.id === form.empleadoId);
      const data = {
        ...form,
        empleadoNombre: emp?.nombre || '',
        empleadoCargo: emp?.cargo || ''
      };

      if (editing) {
        await nominaService.update(editing.id, data);
        toast.success('Nómina actualizada');
      } else {
        await nominaService.add(data);
        toast.success('Pago de nómina registrado');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Eliminar este registro de nómina?')) return;
    try {
      await nominaService.remove(item.id);
      toast.success('Registro eliminado');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 });
  const neto = Number(form.sueldoBase || 0) + Number(form.bonos || 0) - Number(form.descuentos || 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registro de Nómina</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Pago
        </button>
      </div>

      <div className="card">
        <div className="card-header">Historial de Nómina</div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <DollarSign size={40} />
              <p>No hay registros de nómina</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Empleado</th>
                  <th>Sueldo Base</th>
                  <th>Bonos</th>
                  <th>Descuentos</th>
                  <th>Neto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.periodo}</strong></td>
                    <td>{item.empleadoNombre}</td>
                    <td>{fmt(item.sueldoBase)}</td>
                    <td className="text-success">+{fmt(item.bonos)}</td>
                    <td className="text-danger">-{fmt(item.descuentos)}</td>
                    <td><strong>{fmt(item.neto)}</strong></td>
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
        <Modal title={editing ? 'Editar Nómina' : 'Registrar Pago de Nómina'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Empleado *</label>
              <select className="form-control" value={form.empleadoId}
                onChange={e => setForm({ ...form, empleadoId: e.target.value })}>
                <option value="">Seleccionar empleado...</option>
                {empleados.map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.cargo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Periodo de Pago (Mes/Año) *</label>
              <input type="month" className="form-control" value={form.periodo}
                onChange={e => setForm({ ...form, periodo: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Sueldo Base *</label>
                <input type="number" className="form-control" value={form.sueldoBase}
                  onChange={e => setForm({ ...form, sueldoBase: e.target.value })} min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Bonos</label>
                <input type="number" className="form-control" value={form.bonos}
                  onChange={e => setForm({ ...form, bonos: e.target.value })} min="0" step="0.01" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Descuentos</label>
                <input type="number" className="form-control" value={form.descuentos}
                  onChange={e => setForm({ ...form, descuentos: e.target.value })} min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Neto a Pagar</label>
                <input type="text" className="form-control" value={fmt(neto)} disabled
                  style={{ fontWeight: 700, color: 'var(--success)' }} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Actualizar' : 'Registrar Pago'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
