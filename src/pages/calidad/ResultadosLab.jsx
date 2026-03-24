import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TestTubes } from 'lucide-react';
import Modal from '../../components/Modal';
import { resultadosService, muestrasService } from '../../services/calidadService';
import { tiposPruebaService } from '../../services/catalogosService';
import toast from 'react-hot-toast';
import '../../styles/calidad.css';

export default function ResultadosLab() {
  const [items, setItems] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [tiposPrueba, setTiposPrueba] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ muestraId: '', tipoPruebaId: '', valorResultado: '', observaciones: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [r, m, tp] = await Promise.all([
        resultadosService.getAll(),
        muestrasService.getAll(),
        tiposPruebaService.getAll()
      ]);
      setItems(r);
      setMuestras(m);
      setTiposPrueba(tp);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ muestraId: '', tipoPruebaId: '', valorResultado: '', observaciones: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      muestraId: item.muestraId || '',
      tipoPruebaId: item.tipoPruebaId || '',
      valorResultado: item.valorResultado || '',
      observaciones: item.observaciones || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.muestraId) return toast.error('Seleccione la muestra');
    if (!form.tipoPruebaId) return toast.error('Seleccione el tipo de prueba');
    if (form.valorResultado === '' || form.valorResultado === null) return toast.error('Ingrese el resultado');

    try {
      const muestra = muestras.find(m => m.id === form.muestraId);
      const tp = tiposPrueba.find(t => t.id === form.tipoPruebaId);
      const data = {
        ...form,
        valorResultado: Number(form.valorResultado),
        muestraLote: muestra?.loteCodigoLote || '',
        muestraProducto: muestra?.loteProducto || '',
        loteId: muestra?.loteId || '',
        tipoPruebaNombre: tp?.nombre || '',
        tipoPruebaUnidad: tp?.unidad || ''
      };

      if (editing) {
        await resultadosService.update(editing.id, data);
        toast.success('Resultado actualizado');
      } else {
        await resultadosService.add(data);
        toast.success('Resultado registrado');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Eliminar este resultado?')) return;
    try {
      await resultadosService.remove(item.id);
      toast.success('Resultado eliminado');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Resultados de Laboratorio</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Registrar Resultado
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <TestTubes size={40} />
              <p>No hay resultados registrados</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Producto</th>
                  <th>Tipo de Prueba</th>
                  <th>Resultado</th>
                  <th>Unidad</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.muestraLote}</strong></td>
                    <td>{item.muestraProducto}</td>
                    <td>{item.tipoPruebaNombre}</td>
                    <td><strong>{item.valorResultado}</strong></td>
                    <td>{item.tipoPruebaUnidad || '-'}</td>
                    <td>{item.fecha ? new Date(item.fecha).toLocaleString() : '-'}</td>
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
        <Modal title={editing ? 'Editar Resultado' : 'Registrar Resultado de Laboratorio'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Muestra (Lote) *</label>
              <select className="form-control" value={form.muestraId} onChange={e => setForm({ ...form, muestraId: e.target.value })}>
                <option value="">Seleccionar muestra...</option>
                {muestras.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.loteCodigoLote} — {m.loteProducto} ({new Date(m.fechaMuestreo).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Prueba *</label>
                <select className="form-control" value={form.tipoPruebaId} onChange={e => setForm({ ...form, tipoPruebaId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {tiposPrueba.map(tp => <option key={tp.id} value={tp.id}>{tp.nombre} {tp.unidad ? `(${tp.unidad})` : ''}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Resultado Obtenido *</label>
                <input type="number" className="form-control" value={form.valorResultado} onChange={e => setForm({ ...form, valorResultado: e.target.value })} step="any" placeholder="Valor numérico" />
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea className="form-control" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} placeholder="Notas adicionales..." />
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
