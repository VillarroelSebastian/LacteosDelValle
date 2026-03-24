import { db } from '../firebase/firestore';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { lotesService } from './produccionService';

const col = (name) => collection(db, name);

// ── Muestras ───────────────────────────────────
export const muestrasService = {
  getAll: async () => {
    const snap = await getDocs(query(col('muestras'), orderBy('fechaMuestreo', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    return (await addDoc(col('muestras'), {
      ...data,
      fechaMuestreo: data.fechaMuestreo || new Date().toISOString(),
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'muestras', id), data);
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'muestras', id));
  }
};

// ── Resultados de Laboratorio ──────────────────
export const resultadosService = {
  getAll: async () => {
    const snap = await getDocs(query(col('resultadosLab'), orderBy('fecha', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getByMuestra: async (muestraId) => {
    const snap = await getDocs(query(col('resultadosLab'), where('muestraId', '==', muestraId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getByLote: async (loteId) => {
    // First get muestras for this lote
    const muestrasSnap = await getDocs(query(col('muestras'), where('loteId', '==', loteId)));
    const muestraIds = muestrasSnap.docs.map(d => d.id);
    if (muestraIds.length === 0) return [];

    const allResults = [];
    for (const mId of muestraIds) {
      const snap = await getDocs(query(col('resultadosLab'), where('muestraId', '==', mId)));
      snap.docs.forEach(d => allResults.push({ id: d.id, ...d.data() }));
    }
    return allResults;
  },
  add: async (data) => {
    return (await addDoc(col('resultadosLab'), {
      ...data,
      valorResultado: Number(data.valorResultado),
      fecha: new Date().toISOString(),
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'resultadosLab', id), data);
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'resultadosLab', id));
  }
};

// ── Validaciones de Calidad ────────────────────
export const validacionesService = {
  getAll: async () => {
    const snap = await getDocs(query(col('validacionesCalidad'), orderBy('fecha', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  validarLote: async (loteId, resultados, parametros, responsableId, responsableNombre) => {
    // Compare each result vs parameters
    const detalles = resultados.map(r => {
      const param = parametros.find(p => p.tipoPruebaId === r.tipoPruebaId);
      if (!param) return { ...r, cumple: true, sinParametro: true };
      const valor = Number(r.valorResultado);
      const min = Number(param.valorMin);
      const max = Number(param.valorMax);
      const cumple = valor >= min && valor <= max;
      return {
        tipoPrueba: r.tipoPruebaNombre,
        valor,
        min,
        max,
        unidad: param.unidad || '',
        cumple
      };
    });

    const todoCumple = detalles.every(d => d.cumple);
    const estado = todoCumple ? 'liberado' : 'bloqueado';

    // Update lot state
    await lotesService.updateEstado(loteId, estado, {
      responsableCalidadId: responsableId,
      responsableCalidadNombre: responsableNombre,
      fechaValidacion: new Date().toISOString()
    });

    // Save validation record
    const docRef = await addDoc(col('validacionesCalidad'), {
      loteId,
      estado,
      detalles,
      responsableId,
      responsableNombre,
      fecha: new Date().toISOString(),
      creadoEn: serverTimestamp()
    });

    return { id: docRef.id, estado, detalles };
  }
};
