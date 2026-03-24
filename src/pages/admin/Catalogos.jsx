import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import {
  responsablesService, maquinasService, procesosService,
  tiposPruebaService, parametrosCalidadService, productosService,
  distribuidoresService
} from '../../services/catalogosService';
import toast from 'react-hot-toast';
import '../../styles/catalogos.css';

const TABS = [
  { key: 'maquinas', label: 'Máquinas / Áreas', fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'descripcion', label: 'Descripción' },
    { name: 'estado', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] }
  ]},
  { key: 'procesos', label: 'Procesos', fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'descripcion', label: 'Descripción' }
  ]},
  { key: 'productos', label: 'Productos', fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'unidadMedida', label: 'Unidad de Medida', required: true, type: 'select', options: ['Litros', 'Kg', 'Unidades', 'Galones'] },
    { name: 'descripcion', label: 'Descripción' }
  ]},
  { key: 'tiposPrueba', label: 'Tipos de Prueba', fields: [
    { name: 'nombre', label: 'Nombre', required: true },
    { name: 'descripcion', label: 'Descripción' },
    { name: 'unidad', label: 'Unidad de Medida' }
  ]},
  { key: 'parametrosCalidad', label: 'Parámetros Calidad', fields: [
    { name: 'tipoPruebaId', label: 'Tipo de Prueba', type: 'ref', refKey: 'tiposPrueba', required: true },
    { name: 'nombre', label: 'Parámetro', required: true },
    { name: 'valorMin', label: 'Valor Mínimo', type: 'number', required: true },
    { name: 'valorMax', label: 'Valor Máximo', type: 'number', required: true },
    { name: 'unidad', label: 'Unidad' }
  ]},
  { key: 'distribuidores', label: 'Distribuidores', fields: [
    { name: 'nombre', label: 'Nombre/Razón Social', required: true },
    { name: 'contacto', label: 'Persona de Contacto', required: true },
    { name: 'telefono', label: 'Teléfono', required: true },
    { name: 'direccion', label: 'Dirección' },
    { name: 'tipo', label: 'Tipo de Insumo' }
  ]}
];

const services = {
  maquinas: maquinasService,
  procesos: procesosService,
  tiposPrueba: tiposPruebaService,
  parametrosCalidad: parametrosCalidadService,
  productos: productosService,
  distribuidores: distribuidoresService
};

export default function Catalogos() {
  const [tab, setTab] = useState('maquinas');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [refData, setRefData] = useState({});

  const currentTab = TABS.find(t => t.key === tab);
  const svc = services[tab];

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await svc.getAll();
      setItems(data);
      // Load ref data if needed
      const refs = currentTab.fields.filter(f => f.type === 'ref');
      const newRefData = {};
      for (const ref of refs) {
        newRefData[ref.refKey] = await services[ref.refKey].getAll();
      }
      setRefData(newRefData);
    } catch (e) {
      toast.error('Error al cargar datos');
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    const emptyForm = {};
    currentTab.fields.forEach(f => { emptyForm[f.name] = ''; });
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const editForm = {};
    currentTab.fields.forEach(f => { editForm[f.name] = item[f.name] || ''; });
    setForm(editForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = currentTab.fields.filter(f => f.required);
    for (const f of required) {
      if (!form[f.name]?.toString().trim()) {
        toast.error(`${f.label} es obligatorio`);
        return;
      }
    }
    try {
      // For ref fields, also save the name for display
      const data = { ...form };
      currentTab.fields.filter(f => f.type === 'ref').forEach(f => {
        const refItem = refData[f.refKey]?.find(r => r.id === form[f.name]);
        if (refItem) data[f.name.replace('Id', 'Nombre')] = refItem.nombre;
      });

      if (editing) {
        await svc.update(editing.id, data);
        toast.success('Actualizado correctamente');
      } else {
        await svc.add(data);
        toast.success('Creado correctamente');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.nombre || item.id}"?`)) return;
    try {
      await svc.remove(item.id);
      toast.success('Eliminado');
      load();
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const getDisplayColumns = () => {
    return currentTab.fields.map(f => ({
      ...f,
      getValue: (item) => {
        if (f.type === 'ref') {
          return item[f.name.replace('Id', 'Nombre')] || item[f.name];
        }
        return item[f.name];
      }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Catálogos</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="catalogos-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`cat-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p>No hay registros en {currentTab.label}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {getDisplayColumns().map(c => (
                    <th key={c.name}>{c.label}</th>
                  ))}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    {getDisplayColumns().map(c => (
                      <td key={c.name}>{c.getValue(item)}</td>
                    ))}
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => openEdit(item)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon danger" onClick={() => handleDelete(item)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
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
        <Modal title={editing ? `Editar ${currentTab.label}` : `Nuevo ${currentTab.label}`} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            {currentTab.fields.map(f => (
              <div className="form-group" key={f.name}>
                <label>{f.label} {f.required && '*'}</label>
                {f.type === 'select' ? (
                  <select
                    className="form-control"
                    value={form[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'ref' ? (
                  <select
                    className="form-control"
                    value={form[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {(refData[f.refKey] || []).map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    className="form-control"
                    value={form[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    placeholder={f.label}
                    step={f.type === 'number' ? 'any' : undefined}
                  />
                )}
              </div>
            ))}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Actualizar' : 'Crear'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
