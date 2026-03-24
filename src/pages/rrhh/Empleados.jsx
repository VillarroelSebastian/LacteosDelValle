import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, UserCheck } from 'lucide-react';
import Modal from '../../components/Modal';
import { empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/rrhh.css';

const ROLES = [
  'Operador de Planta',
  'Supervisor de Producción',
  'Jefe de Producción',
  'Analista de Calidad',
  'Supervisor de Calidad',
  'Asistente RRHH',
  'Gerente General',
  'Contador',
  'Vendedor'
];

const AREAS = ['Producción', 'Calidad', 'Recursos Humanos', 'Administración', 'Ventas', 'Logística'];

export default function Empleados() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '', cedula: '', telefono: '', email: '',
    cargo: '', area: '', rol: '', fechaIngreso: ''
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await empleadosService.getAll());
    } catch (e) {
      toast.error('Error al cargar empleados');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      nombre: '', cedula: '', telefono: '', email: '',
      cargo: '', area: 'Producción', rol: 'Operador de Planta',
      fechaIngreso: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || '',
      cedula: item.cedula || '',
      telefono: item.telefono || '',
      email: item.email || '',
      cargo: item.cargo || '',
      area: item.area || '',
      rol: item.rol || '',
      fechaIngreso: item.fechaIngreso || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('Nombre es obligatorio');
    if (!form.cedula.trim()) return toast.error('Cédula es obligatoria');
    if (!form.cargo.trim()) return toast.error('Cargo es obligatorio');
    if (!form.rol) return toast.error('Rol es obligatorio');

    try {
      if (editing) {
        await empleadosService.update(editing.id, form);
        toast.success('Empleado actualizado');
      } else {
        await empleadosService.add(form);
        toast.success('Empleado registrado — código interno asignado');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar a "${item.nombre}"?`)) return;
    try {
      await empleadosService.remove(item.id);
      toast.success('Empleado eliminado');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const activos = items.filter(i => i.estado === 'Activo');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Gestión de Empleados</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Empleado
        </button>
      </div>

      {/* Summary cards */}
      <div className="rrhh-summary">
        <div className="rrhh-stat">
          <Users size={20} />
          <div>
            <span className="num">{items.length}</span>
            <span className="label">Total Empleados</span>
          </div>
        </div>
        <div className="rrhh-stat activo">
          <UserCheck size={20} />
          <div>
            <span className="num">{activos.length}</span>
            <span className="label">Activos</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Directorio de Empleados</div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Users size={40} />
              <p>No hay empleados registrados</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Cargo</th>
                  <th>Área</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><code className="emp-code">{item.codigoInterno}</code></td>
                    <td><strong>{item.nombre}</strong></td>
                    <td>{item.cedula}</td>
                    <td>{item.cargo}</td>
                    <td><span className="badge badge-primary">{item.area}</span></td>
                    <td><span className="badge badge-info">{item.rol}</span></td>
                    <td>
                      <span className={`badge ${item.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                        {item.estado}
                      </span>
                    </td>
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
        <Modal title={editing ? 'Editar Empleado' : 'Registrar Nuevo Empleado'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input type="text" className="form-control" value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cédula *</label>
                <input type="text" className="form-control" value={form.cedula}
                  onChange={e => setForm({ ...form, cedula: e.target.value })} placeholder="V-12345678" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" className="form-control" value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="0412-1234567" />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-control" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cargo *</label>
                <input type="text" className="form-control" value={form.cargo}
                  onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ej: Técnico de Producción" />
              </div>
              <div className="form-group">
                <label>Área de Trabajo *</label>
                <select className="form-control" value={form.area}
                  onChange={e => setForm({ ...form, area: e.target.value })}>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Rol en el Sistema *</label>
                <select className="form-control" value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}>
                  <option value="">Seleccionar rol...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de Ingreso</label>
                <input type="date" className="form-control" value={form.fechaIngreso}
                  onChange={e => setForm({ ...form, fechaIngreso: e.target.value })} />
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
