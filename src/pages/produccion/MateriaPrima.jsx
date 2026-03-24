import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import Modal from '../../components/Modal';
import { materiaService } from '../../services/produccionService';
import { distribuidoresService } from '../../services/catalogosService';
import { empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/produccion.css';

export default function MateriaPrima() {
  const [items, setItems] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [distribuidores, setDistribuidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '', stock: '', unidadMedida: '', fechaIngreso: '',
    responsableId: '', distribuidorId: ''
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [mp, emp, dist] = await Promise.all([
        materiaService.getAll(),
        empleadosService.getByRoles(['Operador de Planta', 'Supervisor de Producción', 'Jefe de Producción']),
        distribuidoresService.getAll()
      ]);
      setItems(mp);
      setEmpleados(emp);
      setDistribuidores(dist);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      nombre: '', stock: '', unidadMedida: 'Litros',
      fechaIngreso: new Date().toISOString().split('T')[0],
      responsableId: '', distribuidorId: ''
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || '',
      stock: item.stock || '',
      unidadMedida: item.unidadMedida || 'Litros',
      fechaIngreso: item.fechaIngreso || '',
      responsableId: item.responsableId || '',
      distribuidorId: item.distribuidorId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('Nombre es obligatorio');
    if (!form.stock || Number(form.stock) < 0) return toast.error('Stock debe ser un número válido');
    if (!form.responsableId) return toast.error('Seleccione un responsable');
    if (!form.distribuidorId) return toast.error('Seleccione un distribuidor');

    try {
      const emp = empleados.find(em => em.id === form.responsableId);
      const dist = distribuidores.find(d => d.id === form.distribuidorId);
      const data = {
        ...form,
        stock: Number(form.stock),
        responsableNombre: emp?.nombre || '',
        distribuidorNombre: dist?.nombre || ''
      };

      if (editing) {
        await materiaService.update(editing.id, data);
        toast.success('Materia prima actualizada');
      } else {
        await materiaService.add(data);
        toast.success('Materia prima registrada');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      await materiaService.remove(item.id);
      toast.success('Eliminada');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Materia Prima</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Ingreso
        </button>
      </div>

      {/* Stock summary */}
      {items.length > 0 && (
        <div className="stock-grid">
          {items.map(item => (
            <div className="stock-card" key={item.id}>
              <h4>{item.nombre}</h4>
              <div className="stock-qty">{item.stock}</div>
              <div className="stock-unit">{item.unidadMedida}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span>Registro de Materia Prima</span>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Package size={40} />
              <p>No hay materia prima registrada</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Stock</th>
                  <th>Unidad</th>
                  <th>Responsable</th>
                  <th>Distribuidor</th>
                  <th>Fecha Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.nombre}</strong></td>
                    <td>
                      <span className={`badge ${item.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td>{item.unidadMedida}</td>
                    <td>{item.responsableNombre || '-'}</td>
                    <td>{item.distribuidorNombre || '-'}</td>
                    <td>{item.fechaIngreso || '-'}</td>
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
        <Modal title={editing ? 'Editar Materia Prima' : 'Registrar Ingreso de Materia Prima'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Leche Cruda" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad (Stock) *</label>
                <input type="number" className="form-control" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} min="0" step="any" />
              </div>
              <div className="form-group">
                <label>Unidad de Medida *</label>
                <select className="form-control" value={form.unidadMedida} onChange={e => setForm({ ...form, unidadMedida: e.target.value })}>
                  <option value="Litros">Litros</option>
                  <option value="Kg">Kg</option>
                  <option value="Unidades">Unidades</option>
                  <option value="Galones">Galones</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Responsable del Ingreso *</label>
                <select className="form-control" value={form.responsableId} onChange={e => setForm({ ...form, responsableId: e.target.value })} required>
                  <option value="">Seleccionar responsable...</option>
                  {empleados.map(em => (
                    <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Distribuidor / Proveedor *</label>
                <select className="form-control" value={form.distribuidorId} onChange={e => setForm({ ...form, distribuidorId: e.target.value })} required>
                  <option value="">Seleccionar distribuidor...</option>
                  {distribuidores.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Ingreso</label>
                <input type="date" className="form-control" value={form.fechaIngreso} onChange={e => setForm({ ...form, fechaIngreso: e.target.value })} />
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
