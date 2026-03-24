import { db } from '../firebase/firestore';
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp
} from 'firebase/firestore';

const col = (name) => collection(db, name);

// ── Materia Prima ──────────────────────────────
export const materiaService = {
  getAll: async () => {
    const snap = await getDocs(query(col('materiaPrima'), orderBy('nombre')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    return (await addDoc(col('materiaPrima'), {
      ...data,
      stock: Number(data.stock) || 0,
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'materiaPrima', id), data);
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'materiaPrima', id));
  },
  updateStock: async (id, cantidad) => {
    const ref = doc(db, 'materiaPrima', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Materia prima no encontrada');
    const current = snap.data().stock || 0;
    const newStock = current - Number(cantidad);
    if (newStock < 0) throw new Error('Stock insuficiente');
    await updateDoc(ref, { stock: newStock });
  },
  addStock: async (id, cantidad) => {
    const ref = doc(db, 'materiaPrima', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Materia prima no encontrada');
    const current = snap.data().stock || 0;
    await updateDoc(ref, { stock: current + Number(cantidad) });
  }
};

// ── Órdenes de Producción ──────────────────────
export const ordenesService = {
  getAll: async () => {
    const snap = await getDocs(query(col('ordenesProduccion'), orderBy('fecha', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getById: async (id) => {
    const snap = await getDoc(doc(db, 'ordenesProduccion', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  add: async (data) => {
    return (await addDoc(col('ordenesProduccion'), {
      ...data,
      estado: 'pendiente',
      cantidadProducida: 0,
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'ordenesProduccion', id), data);
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'ordenesProduccion', id));
  },
  cerrar: async (ordenId, observacionesCierre) => {
    const data = {
      estado: 'cerrada',
      fechaCierre: serverTimestamp(),
      observacionesCierre: observacionesCierre || ''
    };
    await updateDoc(doc(db, 'ordenesProduccion', ordenId), data);
  }
};

// ── Consumos de Materia Prima ──────────────────
export const consumosService = {
  getByOrden: async (ordenId) => {
    const snap = await getDocs(query(col('consumosMP'), where('ordenId', '==', ordenId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    // First discount stock
    await materiaService.updateStock(data.materiaPrimaId, data.cantidad);
    return (await addDoc(col('consumosMP'), {
      ...data,
      cantidad: Number(data.cantidad),
      fecha: new Date().toISOString(),
      creadoEn: serverTimestamp()
    })).id;
  },
  remove: async (consumo) => {
    // Restore stock
    await materiaService.addStock(consumo.materiaPrimaId, consumo.cantidad);
    await deleteDoc(doc(db, 'consumosMP', consumo.id));
  }
};

// ── Avances de Producción ──────────────────────
export const avancesService = {
  getByOrden: async (ordenId) => {
    const snap = await getDocs(query(col('avancesProduccion'), where('ordenId', '==', ordenId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    const docRef = await addDoc(col('avancesProduccion'), {
      ...data,
      cantidadFabricada: Number(data.cantidadFabricada),
      creadoEn: serverTimestamp()
    });
    return docRef.id;
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'avancesProduccion', id));
  }
};

// ── Lotes de Producto Terminado ────────────────
export const lotesService = {
  getAll: async () => {
    const snap = await getDocs(query(col('lotesProducto'), orderBy('fechaProduccion', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getByOrden: async (ordenId) => {
    const snap = await getDocs(query(col('lotesProducto'), where('ordenId', '==', ordenId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    const codigoLote = `LT-${Date.now().toString(36).toUpperCase()}`;
    const docRef = await addDoc(col('lotesProducto'), {
      ...data,
      codigoLote,
      cantidadProducida: Number(data.cantidadProducida),
      estadoCalidad: 'en_revision',
      fechaProduccion: new Date().toISOString(),
      creadoEn: serverTimestamp()
    });
    // Update total produced in order
    const orden = await ordenesService.getById(data.ordenId);
    if (orden) {
      await ordenesService.update(data.ordenId, {
        cantidadProducida: (orden.cantidadProducida || 0) + Number(data.cantidadProducida),
        estado: 'en_proceso'
      });
    }
    return { id: docRef.id, codigoLote };
  },
  updateEstado: async (id, estado, extra = {}) => {
    await updateDoc(doc(db, 'lotesProducto', id), { estadoCalidad: estado, ...extra });
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'lotesProducto', id));
  }
};
