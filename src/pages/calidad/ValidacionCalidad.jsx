import { useState, useEffect } from 'react';
import { FileCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { resultadosService, validacionesService } from '../../services/calidadService';
import { lotesService } from '../../services/produccionService';
import { parametrosCalidadService } from '../../services/catalogosService';
import { empleadosService } from '../../services/rrhhService';
import toast from 'react-hot-toast';
import '../../styles/calidad.css';

export default function ValidacionCalidad() {
  const [lotes, setLotes] = useState([]);
  const [parametros, setParametros] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedLote, setSelectedLote] = useState('');
  const [selectedResponsable, setSelectedResponsable] = useState('');
  const [resultadosLote, setResultadosLote] = useState([]);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [l, p, emp] = await Promise.all([
        lotesService.getAll(),
        parametrosCalidadService.getAll(),
        empleadosService.getByRoles(['Analista de Calidad', 'Supervisor de Calidad'])
      ]);
      setLotes(l);
      setParametros(p);
      setEmpleados(emp);
    } catch (e) {
      toast.error('Error al cargar');
    }
    setLoading(false);
  };

  const handleSelectLote = async (loteId) => {
    setSelectedLote(loteId);
    setValidationResult(null);
    if (!loteId) { setResultadosLote([]); return; }

    setLoadingResultados(true);
    try {
      const results = await resultadosService.getByLote(loteId);
      setResultadosLote(results);
    } catch (e) {
      toast.error('Error al cargar resultados');
    }
    setLoadingResultados(false);
  };

  const handleValidar = async () => {
    if (!selectedLote) return toast.error('Seleccione un lote');
    if (resultadosLote.length === 0) return toast.error('No hay resultados de laboratorio para este lote');

    try {
      const emp = empleados.find(em => em.id === selectedResponsable);
      const result = await validacionesService.validarLote(
        selectedLote, resultadosLote, parametros,
        selectedResponsable || null, emp?.nombre || ''
      );
      setValidationResult(result);
      if (result.estado === 'liberado') {
        toast.success('✅ Lote LIBERADO — cumple todos los estándares');
      } else {
        toast.error('⛔ Lote BLOQUEADO — no cumple estándares');
      }
      load(); // Refresh lotes
    } catch (e) {
      toast.error('Error: ' + e.message);
    }
  };

  const lotesEnRevision = lotes.filter(l => l.estadoCalidad === 'en_revision');
  const selectedLoteData = lotes.find(l => l.id === selectedLote);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Validación de Conformidad</h1>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">Seleccionar Lote para Validar</div>
            <div className="card-body">
              <div className="form-group">
                <label>Lote a Validar *</label>
                <select className="form-control" value={selectedLote} onChange={e => handleSelectLote(e.target.value)}>
                  <option value="">Seleccionar lote...</option>
                  <optgroup label="En Revisión">
                    {lotesEnRevision.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.codigoLote} — {l.productoNombre} ({l.cantidadProducida} {l.unidadMedida})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Todos los Lotes">
                    {lotes.filter(l => l.estadoCalidad !== 'en_revision').map(l => (
                      <option key={l.id} value={l.id}>
                        {l.codigoLote} — {l.productoNombre} [{l.estadoCalidad}]
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="form-group">
                <label>Responsable que Autoriza</label>
                <select className="form-control" value={selectedResponsable} onChange={e => setSelectedResponsable(e.target.value)}>
                  <option value="">Seleccionar responsable...</option>
                  {empleados.map(em => (
                    <option key={em.id} value={em.id}>{em.nombre} — {em.rol}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Resultados del lote */}
          {selectedLote && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                Resultados de Laboratorio — {selectedLoteData?.codigoLote}
              </div>
              <div className="table-container">
                {loadingResultados ? (
                  <div className="loading">Cargando resultados...</div>
                ) : resultadosLote.length === 0 ? (
                  <div className="empty-state">
                    <AlertTriangle size={30} />
                    <p>No hay resultados de laboratorio para este lote. Registre resultados primero.</p>
                  </div>
                ) : (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>Tipo de Prueba</th>
                          <th>Resultado</th>
                          <th>Mín. Permitido</th>
                          <th>Máx. Permitido</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultadosLote.map(r => {
                          const param = parametros.find(p => p.tipoPruebaId === r.tipoPruebaId);
                          const valor = Number(r.valorResultado);
                          let cumple = true;
                          if (param) {
                            cumple = valor >= Number(param.valorMin) && valor <= Number(param.valorMax);
                          }
                          return (
                            <tr key={r.id}>
                              <td>{r.tipoPruebaNombre}</td>
                              <td><strong>{r.valorResultado}</strong> {r.tipoPruebaUnidad}</td>
                              <td>{param ? `${param.valorMin} ${param.unidad || ''}` : 'Sin parámetro'}</td>
                              <td>{param ? `${param.valorMax} ${param.unidad || ''}` : 'Sin parámetro'}</td>
                              <td>
                                {param ? (
                                  cumple
                                    ? <span className="badge badge-success"><CheckCircle size={12} /> Cumple</span>
                                    : <span className="badge badge-danger"><XCircle size={12} /> No Cumple</span>
                                ) : (
                                  <span className="badge badge-secondary">Sin parámetro</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {selectedLoteData?.estadoCalidad === 'en_revision' && (
                      <div style={{ padding: '1rem', textAlign: 'right' }}>
                        <button className="btn btn-primary" onClick={handleValidar}>
                          <FileCheck size={16} /> Ejecutar Validación
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className={`validation-result ${validationResult.estado === 'liberado' ? 'pass' : 'fail'}`}>
              {validationResult.estado === 'liberado'
                ? <CheckCircle size={28} />
                : <XCircle size={28} />
              }
              <div>
                <h4>{validationResult.estado === 'liberado' ? 'LOTE LIBERADO' : 'LOTE BLOQUEADO'}</h4>
                <p>
                  {validationResult.estado === 'liberado'
                    ? 'Todos los resultados están dentro de los parámetros permitidos. El lote está habilitado para distribución o venta.'
                    : 'Uno o más resultados están fuera de los parámetros permitidos. El lote ha sido bloqueado y no puede ser despachado.'
                  }
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
