import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ClipboardCheck, Star } from 'lucide-react';
import Modal from '../../components/Modal';
import { evaluacionesService, empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/rrhh.css';

export default function Evaluaciones() {
  const [items, setItems] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ empleadoId: '', evaluadorId: '', periodoInicio: '', periodoFin: '', calificacion: 0, observaciones: '', fecha: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ev, em] = await Promise.all([
        evaluacionesService.getAll(),
        empleadosService.getAll()
      ]);
      setItems(ev);
      setEmpleados(em);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ empleadoId: '', evaluadorId: '', periodoInicio: '', periodoFin: '', calificacion: 0, observaciones: '', fecha: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      empleadoId: item.empleadoId || '',
      evaluadorId: item.evaluadorId || '',
      periodoInicio: item.periodoInicio || '',
      periodoFin: item.periodoFin || '',
      calificacion: item.calificacion || 0,
      observaciones: item.observaciones || '',
      fecha: item.fecha || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.empleadoId) return toast.error('Seleccione un empleado');
    if (!form.evaluadorId) return toast.error('Seleccione el evaluador');
    if (!form.periodoInicio || !form.periodoFin) return toast.error('Fechas del periodo son obligatorias');
    if (!form.calificacion || Number(form.calificacion) < 1 || Number(form.calificacion) > 5)
      return toast.error('Debe asignar una calificación (1-5 estrellas)');

    try {
      const emp = empleados.find(em => em.id === form.empleadoId);
      const evalua = empleados.find(em => em.id === form.evaluadorId);
      const data = {
        ...form,
        empleadoNombre: emp?.nombre || '',
        empleadoCargo: emp?.cargo || '',
        evaluadorNombre: evalua?.nombre || '',
        calificacion: Number(form.calificacion)
      };

      if (editing) {
        await evaluacionesService.update(editing.id, data);
        toast.success('Evaluación actualizada');
      } else {
        await evaluacionesService.add(data);
        toast.success('Evaluación registrada');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Eliminar esta evaluación?')) return;
    try {
      await evaluacionesService.remove(item.id);
      toast.success('Evaluación eliminada');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} color="var(--warning)" style={{ marginRight: 2 }} />
    ));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Evaluaciones de Desempeño</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nueva Evaluación
        </button>
      </div>

      <div className="card">
        <div className="card-header">Historial de Evaluaciones</div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <ClipboardCheck size={40} />
              <p>No hay evaluaciones registradas</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Cargo</th>
                  <th>Evaluador</th>
                  <th>Periodo</th>
                  <th>Calificación</th>
                  <th>Fecha Eval.</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.empleadoNombre}</strong></td>
                    <td>{item.empleadoCargo || '-'}</td>
                    <td>{item.evaluadorNombre || '-'}</td>
                    <td>{item.periodoInicio} a {item.periodoFin}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {renderStars(item.calificacion)}
                      </div>
                    </td>
                    <td>{item.fecha}</td>
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
        <Modal title={editing ? 'Editar Evaluación' : 'Nueva Evaluación de Desempeño'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Empleado a Evaluar *</label>
              <select className="form-control" value={form.empleadoId}
                onChange={e => setForm({ ...form, empleadoId: e.target.value })}>
                <option value="">Seleccionar empleado...</option>
                {empleados.map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.cargo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Evaluador (Jefe/Supervisor) *</label>
              <select className="form-control" value={form.evaluadorId}
                onChange={e => setForm({ ...form, evaluadorId: e.target.value })}>
                <option value="">Seleccionar evaluador...</option>
                {empleados.filter(em => em.rol.includes('Jefe') || em.rol.includes('Gerente') || em.rol.includes('Supervisor')).map(em => (
                  <option key={em.id} value={em.id}>{em.nombre} — {em.cargo}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Periodo Desde *</label>
                <input type="date" className="form-control" value={form.periodoInicio}
                  onChange={e => setForm({ ...form, periodoInicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Periodo Hasta *</label>
                <input type="date" className="form-control" value={form.periodoFin}
                  onChange={e => setForm({ ...form, periodoFin: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Calificación *</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => setForm({ ...form, calificacion: star })}
                    >
                      <Star size={24} fill={star <= form.calificacion ? "var(--warning)" : "none"} color="var(--warning)" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Fecha de Evaluación</label>
                <input type="date" className="form-control" value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-control" value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas sobre el desempeño, áreas de mejora..." />
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
