import { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { lotesService } from '../../services/produccionService';
import toast from 'react-hot-toast';
import '../../styles/produccion.css';

export default function ProductoTerminado() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await lotesService.getAll());
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  // Group by product
  const stockPorProducto = items.reduce((acc, item) => {
    const key = item.productoNombre || 'Sin producto';
    if (!acc[key]) acc[key] = { nombre: key, unidad: item.unidadMedida, total: 0, liberado: 0, bloqueado: 0, enRevision: 0 };
    acc[key].total += item.cantidadProducida || 0;
    if (item.estadoCalidad === 'liberado') acc[key].liberado += item.cantidadProducida || 0;
    else if (item.estadoCalidad === 'bloqueado') acc[key].bloqueado += item.cantidadProducida || 0;
    else acc[key].enRevision += item.cantidadProducida || 0;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Producto Terminado</h1>
      </div>

      {/* Stock by product */}
      {Object.keys(stockPorProducto).length > 0 && (
        <div className="stock-grid" style={{ marginBottom: '1.5rem' }}>
          {Object.values(stockPorProducto).map((prod, i) => (
            <div className="stock-card" key={i}>
              <h4>{prod.nombre}</h4>
              <div className="stock-qty">{prod.total}</div>
              <div className="stock-unit">{prod.unidad}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-success">✓ {prod.liberado}</span>
                <span className="badge badge-warning">⏳ {prod.enRevision}</span>
                <span className="badge badge-danger">⛔ {prod.bloqueado}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">Detalle de Lotes</div>
        <div className="table-container">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Box size={40} />
              <p>No hay productos terminados</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Código Lote</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Fecha Producción</th>
                  <th>Estado Calidad</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.codigoLote}</strong></td>
                    <td>{item.productoNombre}</td>
                    <td>{item.cantidadProducida} {item.unidadMedida}</td>
                    <td>{item.fechaProduccion ? new Date(item.fechaProduccion).toLocaleString() : '-'}</td>
                    <td>
                      <span className={`badge ${item.estadoCalidad === 'liberado' ? 'badge-success' : item.estadoCalidad === 'bloqueado' ? 'badge-danger' : 'badge-warning'}`}>
                        {item.estadoCalidad === 'liberado' ? '✓ Liberado' : item.estadoCalidad === 'bloqueado' ? '⛔ Bloqueado' : '⏳ En Revisión'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
