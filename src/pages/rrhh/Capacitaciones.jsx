import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import Modal from '../../components/Modal';
import { capacitacionesService, empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/rrhh.css';

export default function Capacitaciones() {
  const [items, setItems] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ empleadoId: '', curso: '', descripcion: '', fecha: '', duracionHoras: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([
        capacitacionesService.getAll(),
        empleadosService.getAll()
      ]);
      setItems(c);
      setEmpleados(e);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ empleadoId: '', curso: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], duracionHoras: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      empleadoId: item.empleadoId || '',
      curso: item.curso || '',
      descripcion: item.descripcion || '',
      fecha: item.fecha || '',
      duracionHoras: item.duracionHoras || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.empleadoId) return toast.error('Seleccione un empleado');
    if (!form.curso.trim()) return toast.error('Curso es obligatorio');

    try {
      const emp = empleados.find(em => em.id === form.empleadoId);
      const data = {
        ...form,
        empleadoNombre: emp?.nombre || '',
        empleadoCargo: emp?.cargo || '',
        duracionHoras: Number(form.duracionHoras) || 0
      };

      if (editing) {
        await capacitacionesService.update(editing.id, data);
        toast.success('Capacitación actualizada');
      } else {
        await capacitacionesService.add(data);
        toast.success('Capacitación registrada');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Eliminar esta capacitación?')) return;
    try {
      await capacitacionesService.remove(item.id);
      toast.success('Capacitación eliminada');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registro de Capacitaciones</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Capacitación
        </button>
      </div>

      <div className="card">
        <div className="card-header">Historial de Capacitaciones</div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <GraduationCap size={40} />
              <p>No hay capacitaciones registradas</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Curso / Actividad</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Duración (h)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.empleadoNombre}</strong></td>
                    <td>{item.curso}</td>
                    <td>{item.descripcion || '-'}</td>
                    <td>{item.fecha}</td>
                    <td>{item.duracionHoras || '-'}</td>
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
        <Modal title={editing ? 'Editar Capacitación' : 'Registrar Capacitación'} onClose={() => setShowModal(false)}>
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
              <label>Curso o Actividad *</label>
              <select className="form-control" value={form.curso} onChange={e => setForm({ ...form, curso: e.target.value })}>
                <option value="">Seleccionar curso...</option>
                <optgroup label="Calidad e Inocuidad">
                  <option value="Buenas Prácticas de Manufactura (BPM)">Buenas Prácticas de Manufactura (BPM)</option>
                  <option value="Inocuidad Alimentaria">Inocuidad Alimentaria</option>
                  <option value="Control de Calidad en Lácteos">Control de Calidad en Lácteos</option>
                </optgroup>
                <optgroup label="Producción y Operaciones">
                  <option value="Manejo de Pasteurizadoras">Manejo de Pasteurizadoras</option>
                  <option value="Mantenimiento Autónomo de Equipos">Mantenimiento Autónomo de Equipos</option>
                  <option value="Operación de Envasadoras">Operación de Envasadoras</option>
                </optgroup>
                <optgroup label="General">
                  <option value="Seguridad Industrial y Salud Ocupacional">Seguridad Industrial y Salud Ocupacional</option>
                  <option value="Inducción Corporativa y Valores">Inducción Corporativa y Valores</option>
                </optgroup>
                <option value="Otro">Otro (Especificar en descripción)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea className="form-control" value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Detalles del curso..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" className="form-control" value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duración (horas)</label>
                <input type="number" className="form-control" value={form.duracionHoras}
                  onChange={e => setForm({ ...form, duracionHoras: e.target.value })} min="0" step="0.5" />
              </div>
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
