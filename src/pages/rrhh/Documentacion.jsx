import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, AlertTriangle, Paperclip, Download } from 'lucide-react';
import Modal from '../../components/Modal';
import { documentacionService, empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/rrhh.css';

const TIPOS_DOC = [
  'Contrato de Trabajo',
  'Certificado de Salud',
  'Curso de Manipulación de Alimentos',
  'Constancia de Estudios',
  'Certificado de Antecedentes',
  'Seguro Social',
  'Examen Pre-empleo',
  'Otros'
];

const ESTADOS_DOC = ['Vigente', 'Vencido', 'Pendiente', 'No Aplica'];

export default function Documentacion() {
  const [items, setItems] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ empleadoId: '', tipoDocumento: '', estadoDoc: '', fechaVencimiento: '', observaciones: '', archivoNombre: '', archivoData: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [d, e] = await Promise.all([
        documentacionService.getAll(),
        empleadosService.getAll()
      ]);
      setItems(d);
      setEmpleados(e);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ empleadoId: '', tipoDocumento: TIPOS_DOC[0], estadoDoc: 'Vigente', fechaVencimiento: '', observaciones: '', archivoNombre: '', archivoData: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      empleadoId: item.empleadoId || '',
      tipoDocumento: item.tipoDocumento || '',
      estadoDoc: item.estadoDoc || '',
      fechaVencimiento: item.fechaVencimiento || '',
      observaciones: item.observaciones || '',
      archivoNombre: item.archivoNombre || '',
      archivoData: item.archivoData || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.empleadoId) return toast.error('Seleccione un empleado');
    if (!form.tipoDocumento) return toast.error('Tipo de documento es obligatorio');

    try {
      const emp = empleados.find(em => em.id === form.empleadoId);
      const data = {
        ...form,
        empleadoNombre: emp?.nombre || ''
      };

      if (editing) {
        await documentacionService.update(editing.id, data);
        toast.success('Documentación actualizada');
      } else {
        await documentacionService.add(data);
        toast.success('Documento registrado');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      await documentacionService.remove(item.id);
      toast.success('Registro eliminado');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const vencidos = items.filter(i => i.estadoDoc === 'Vencido');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Documentación Laboral</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Documento
        </button>
      </div>

      {vencidos.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            <span><strong>{vencidos.length}</strong> documento(s) vencido(s) requieren atención</span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">Expedientes Laborales</div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} />
              <p>No hay documentación registrada</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Tipo de Documento</th>
                  <th>Estado</th>
                  <th>Fecha Vencimiento</th>
                  <th>Archivo</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.empleadoNombre}</strong></td>
                    <td>{item.tipoDocumento}</td>
                    <td>
                      <span className={`badge ${
                        item.estadoDoc === 'Vigente' ? 'badge-success' :
                        item.estadoDoc === 'Vencido' ? 'badge-danger' :
                        item.estadoDoc === 'Pendiente' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {item.estadoDoc}
                      </span>
                    </td>
                    <td>{item.fechaVencimiento || '-'}</td>
                    <td>
                      {item.archivoNombre ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}><Paperclip size={14} /> {item.archivoNombre}</span>
                          {item.archivoData && (
                            <a href={item.archivoData} download={item.archivoNombre} className="btn-icon" title="Descargar" style={{ color: 'var(--primary)' }}>
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      ) : '-'}
                    </td>
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
        <Modal title={editing ? 'Editar Documento' : 'Registrar Documento Laboral'} onClose={() => setShowModal(false)}>
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
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Documento *</label>
                <select className="form-control" value={form.tipoDocumento}
                  onChange={e => setForm({ ...form, tipoDocumento: e.target.value })}>
                  {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Estado del Documento</label>
                <select className="form-control" value={form.estadoDoc}
                  onChange={e => setForm({ ...form, estadoDoc: e.target.value })}>
                  {ESTADOS_DOC.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento</label>
              <input type="date" className="form-control" value={form.fechaVencimiento}
                onChange={e => setForm({ ...form, fechaVencimiento: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Archivo Adjunto (Opcional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="file" className="form-control" 
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      // Firebase Firestore limit is 1MB. We limit to 800KB to be safe.
                      if (file.size > 800 * 1024) {
                        toast.error('El archivo es muy grande. Máximo permitido: 800 KB');
                        e.target.value = null; // reset
                        return;
                      }

                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setForm({ ...form, archivoNombre: file.name, archivoData: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.png" />
                {form.archivoNombre && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', whiteSpace: 'nowrap' }}>
                    Adjunto: {form.archivoNombre}
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-control" value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas adicionales..." />
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
