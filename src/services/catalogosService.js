import { db } from '../firebase/firestore';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';

// Generic CRUD for any catalog collection
const createService = (collectionName) => {
  const col = () => collection(db, collectionName);

  return {
    getAll: async () => {
      const snap = await getDocs(query(col(), orderBy('nombre')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    add: async (data) => {
      const docRef = await addDoc(col(), { ...data, creadoEn: serverTimestamp() });
      return docRef.id;
    },
    update: async (id, data) => {
      await updateDoc(doc(db, collectionName, id), data);
    },
    remove: async (id) => {
      await deleteDoc(doc(db, collectionName, id));
    }
  };
};

export const responsablesService = createService('responsables');
export const maquinasService = createService('maquinas');
export const procesosService = createService('procesos');
export const tiposPruebaService = createService('tiposPrueba');
export const parametrosCalidadService = createService('parametrosCalidad');
export const productosService = createService('productos');
export const distribuidoresService = createService('distribuidores');
