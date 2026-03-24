import { db } from '../firebase/firestore.js';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const seedData = {
  maquinas: [
    { nombre: 'Pasteurizadora Alfa', descripcion: 'Línea de pasteurización rápida', estado: 'Activa' },
    { nombre: 'Envasadora Tetra-1', descripcion: 'Línea de envasado tetrapak', estado: 'Activa' },
    { nombre: 'Tina Quesera 500L', descripcion: 'Elaboración de quesos frescos', estado: 'Activa' },
    { nombre: 'Incubadora Yogurt', descripcion: 'Fermentación de yogurt', estado: 'Activa' }
  ],
  procesos: [
    { nombre: 'Pasteurización', descripcion: 'Tratamiento térmico de leche cruda' },
    { nombre: 'Fermentación', descripcion: 'Proceso de cultivo láctico' },
    { nombre: 'Coagulación', descripcion: 'Corte y desuerado para quesos' },
    { nombre: 'Envasado', descripcion: 'Empaquetado final del producto' }
  ],
  productos: [
    { nombre: 'Leche Pasteurizada Entera', unidadMedida: 'Litros', descripcion: 'Sachet 1L' },
    { nombre: 'Yogurt Frutado', unidadMedida: 'Litros', descripcion: 'Botella 1L, sabor Fresa/Durazno' },
    { nombre: 'Queso Fresco', unidadMedida: 'Kg', descripcion: 'Queso blanco fresco, molde 1kg' },
    { nombre: 'Queso Edam', unidadMedida: 'Kg', descripcion: 'Queso madurado, molde 2kg' }
  ],
  tiposPrueba: [
    { nombre: 'Acidez Titulable', descripcion: 'Medición de ácido láctico', unidad: '% Ácido Láctico' },
    { nombre: 'pH', descripcion: 'Medición de pH en producto final', unidad: '' },
    { nombre: 'Grasa', descripcion: 'Contenido de materia grasa (Gerber)', unidad: '%' },
    { nombre: 'Densidad', descripcion: 'Densidad específica a 15°C', unidad: 'g/ml' }
  ],
  empleados: [
    { nombre: 'Carlos Mendoza', cedula: 'V-15234567', telefono: '0414-5551234', email: 'cmendoza@lacteosv.com', cargo: 'Jefe de Producción', area: 'Producción', rol: 'Jefe de Producción', fechaIngreso: '2020-03-15', estado: 'Activo', codigoInterno: 'EMP-001' },
    { nombre: 'María López', cedula: 'V-16345678', telefono: '0412-5552345', email: 'mlopez@lacteosv.com', cargo: 'Supervisora de Calidad', area: 'Calidad', rol: 'Supervisor de Calidad', fechaIngreso: '2019-08-01', estado: 'Activo', codigoInterno: 'EMP-002' },
    { nombre: 'José Ramírez', cedula: 'V-18456789', telefono: '0424-5553456', email: 'jramirez@lacteosv.com', cargo: 'Operador de Planta', area: 'Producción', rol: 'Operador de Planta', fechaIngreso: '2021-01-10', estado: 'Activo', codigoInterno: 'EMP-003' },
    { nombre: 'Ana Torres', cedula: 'V-17567890', telefono: '0414-5554567', email: 'atorres@lacteosv.com', cargo: 'Analista de Laboratorio', area: 'Calidad', rol: 'Analista de Calidad', fechaIngreso: '2021-06-15', estado: 'Activo', codigoInterno: 'EMP-004' },
    { nombre: 'Luis Herrera', cedula: 'V-19678901', telefono: '0416-5555678', email: 'lherrera@lacteosv.com', cargo: 'Operador de Planta', area: 'Producción', rol: 'Operador de Planta', fechaIngreso: '2022-02-20', estado: 'Activo', codigoInterno: 'EMP-005' },
    { nombre: 'Carmen Vega', cedula: 'V-14789012', telefono: '0412-5556789', email: 'cvega@lacteosv.com', cargo: 'Asistente de RRHH', area: 'Recursos Humanos', rol: 'Asistente RRHH', fechaIngreso: '2020-11-01', estado: 'Activo', codigoInterno: 'EMP-006' },
    { nombre: 'Pedro Díaz', cedula: 'V-12890123', telefono: '0414-5557890', email: 'pdiaz@lacteosv.com', cargo: 'Gerente General', area: 'Administración', rol: 'Gerente General', fechaIngreso: '2018-01-15', estado: 'Activo', codigoInterno: 'EMP-007' }
  ],
  distribuidores: [
    { nombre: 'Ganadería El Roble', contacto: 'Roberto Sánchez', telefono: '0414-7771234', direccion: 'Finca El Roble, Valle de Aragua', tipo: 'Leche Cruda' },
    { nombre: 'Insumos Lácteos S.A.', contacto: 'Laura Martínez', telefono: '0212-5559876', direccion: 'Zona Industrial, Valencia', tipo: 'Cultivos y Enzimas' },
    { nombre: 'Empaques del Valle', contacto: 'Miguel Fernández', telefono: '0424-6664321', direccion: 'Av. Principal, Maracay', tipo: 'Material de Empaque' }
  ]
};

async function clearCollection(name) {
  const querySnapshot = await getDocs(collection(db, name));
  const promises = [];
  querySnapshot.forEach((document) => {
    promises.push(deleteDoc(doc(db, name, document.id)));
  });
  await Promise.all(promises);
  console.log(`Colección ${name} vaciada.`);
}

async function seed() {
  try {
    console.log('Iniciando poblamiento de base de datos...');
    
    // Clear collections
    await clearCollection('maquinas');
    await clearCollection('procesos');
    await clearCollection('productos');
    await clearCollection('tiposPrueba');
    await clearCollection('parametrosCalidad');
    await clearCollection('responsables');
    await clearCollection('empleados');
    await clearCollection('distribuidores');

    // Insert new data
    const tiposPruebaIds = {};

    for (const maq of seedData.maquinas) {
      await addDoc(collection(db, 'maquinas'), maq);
    }
    console.log('✓ Máquinas insertadas');

    for (const proc of seedData.procesos) {
      await addDoc(collection(db, 'procesos'), proc);
    }
    console.log('✓ Procesos insertados');

    for (const prod of seedData.productos) {
      await addDoc(collection(db, 'productos'), prod);
    }
    console.log('✓ Productos insertados');

    for (const tp of seedData.tiposPrueba) {
      const docRef = await addDoc(collection(db, 'tiposPrueba'), tp);
      tiposPruebaIds[tp.nombre] = docRef.id;
    }
    console.log('✓ Tipos de Prueba insertados');

    // Create parameters mapping to test types
    const parametros = [
      { tipoPruebaId: tiposPruebaIds['Acidez Titulable'], nombre: 'Acidez Leche', valorMin: 0.14, valorMax: 0.17, unidad: '%' },
      { tipoPruebaId: tiposPruebaIds['Acidez Titulable'], nombre: 'Acidez Yogurt', valorMin: 0.65, valorMax: 0.85, unidad: '%' },
      { tipoPruebaId: tiposPruebaIds['pH'], nombre: 'pH Leche', valorMin: 6.6, valorMax: 6.8, unidad: '' },
      { tipoPruebaId: tiposPruebaIds['pH'], nombre: 'pH Queso Fresco', valorMin: 5.1, valorMax: 5.4, unidad: '' },
      { tipoPruebaId: tiposPruebaIds['Grasa'], nombre: 'Grasa Leche Entera', valorMin: 3.0, valorMax: 3.5, unidad: '%' },
      { tipoPruebaId: tiposPruebaIds['Densidad'], nombre: 'Densidad Leche', valorMin: 1.028, valorMax: 1.033, unidad: 'g/ml' }
    ];

    for (const param of parametros) {
      await addDoc(collection(db, 'parametrosCalidad'), param);
    }
    console.log('✓ Parámetros de Calidad insertados');

    // Insert employees
    for (const emp of seedData.empleados) {
      await addDoc(collection(db, 'empleados'), { ...emp, creadoEn: serverTimestamp() });
    }
    console.log('✓ Empleados insertados (7 empleados con roles asignados)');

    // Insert distributors
    for (const dist of seedData.distribuidores) {
      await addDoc(collection(db, 'distribuidores'), dist);
    }
    console.log('✓ Distribuidores insertados (3 proveedores)');

    console.log('\n✅ Poblamiento completado con éxito!');
    console.log('   - 4 Máquinas');
    console.log('   - 4 Procesos');
    console.log('   - 4 Productos');
    console.log('   - 4 Tipos de Prueba');
    console.log('   - 6 Parámetros de Calidad');
    console.log('   - 7 Empleados');
    console.log('   - 3 Distribuidores');
    process.exit(0);

  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

seed();
