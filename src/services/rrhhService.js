import { db } from '../firebase/firestore';
import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp
} from 'firebase/firestore';

const col = (name) => collection(db, name);

// ── Empleados ──────────────────────────────────
export const empleadosService = {
  getAll: async () => {
    const snap = await getDocs(query(col('empleados'), orderBy('nombre')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getByRol: async (rol) => {
    const snap = await getDocs(query(col('empleados'), where('rol', '==', rol)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getByRoles: async (roles) => {
    // Firestore 'in' query supports up to 10 values
    const snap = await getDocs(query(col('empleados'), where('rol', 'in', roles)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getById: async (id) => {
    const snap = await getDoc(doc(db, 'empleados', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  add: async (data) => {
    const codigoInterno = `EMP-${Date.now().toString(36).toUpperCase()}`;
    return (await addDoc(col('empleados'), {
      ...data,
      codigoInterno,
      estado: 'Activo',
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'empleados', id), data);
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'empleados', id));
  }
};

// ── Capacitaciones ─────────────────────────────
export const capacitacionesService = {
  getAll: async () => {
    const snap = await getDocs(query(col('capacitaciones'), orderBy('fecha', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    return (await addDoc(col('capacitaciones'), {
      ...data,
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'capacitaciones', id), data);
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'capacitaciones', id));
  }
};

// ── Evaluaciones de Desempeño ──────────────────
export const evaluacionesService = {
  getAll: async () => {
    const snap = await getDocs(query(col('evaluaciones'), orderBy('fecha', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    return (await addDoc(col('evaluaciones'), {
      ...data,
      calificacion: Number(data.calificacion),
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'evaluaciones', id), {
      ...data,
      calificacion: Number(data.calificacion)
    });
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'evaluaciones', id));
  }
};

// ── Nómina ─────────────────────────────────────
export const nominaService = {
  getAll: async () => {
    const snap = await getDocs(query(col('nominas'), orderBy('periodo', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    const sueldo = Number(data.sueldoBase) || 0;
    const bonos = Number(data.bonos) || 0;
    const descuentos = Number(data.descuentos) || 0;
    const neto = sueldo + bonos - descuentos;
    return (await addDoc(col('nominas'), {
      ...data,
      sueldoBase: sueldo,
      bonos,
      descuentos,
      neto,
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    const sueldo = Number(data.sueldoBase) || 0;
    const bonos = Number(data.bonos) || 0;
    const descuentos = Number(data.descuentos) || 0;
    const neto = sueldo + bonos - descuentos;
    await updateDoc(doc(db, 'nominas', id), {
      ...data,
      sueldoBase: sueldo,
      bonos,
      descuentos,
      neto
    });
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'nominas', id));
  }
};

// ── Documentación Laboral ──────────────────────
export const documentacionService = {
  getAll: async () => {
    const snap = await getDocs(query(col('documentacionLaboral'), orderBy('fechaActualizacion', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getByEmpleado: async (empleadoId) => {
    const snap = await getDocs(query(col('documentacionLaboral'), where('empleadoId', '==', empleadoId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  add: async (data) => {
    return (await addDoc(col('documentacionLaboral'), {
      ...data,
      fechaActualizacion: new Date().toISOString(),
      creadoEn: serverTimestamp()
    })).id;
  },
  update: async (id, data) => {
    await updateDoc(doc(db, 'documentacionLaboral', id), {
      ...data,
      fechaActualizacion: new Date().toISOString()
    });
  },
  remove: async (id) => {
    await deleteDoc(doc(db, 'documentacionLaboral', id));
  }
};
