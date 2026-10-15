import { validarLectura, clasificarLectura, obtenerProtocoloAccion, generarResumen, buscarLecturaPorId } from "./monitor.js";
const RANGOS = {
    temperatura: [18, 28],
    humedad: [40, 70],
    luminosidad: [300, 800]
};
const loteExterno = [
    { id: "LEC-101", fecha: "2026-10-15T06:00:00Z", zona: "Sector A", sensor: "temperatura", valor: 22.5, unidad: "°C", nota: "Matutina" },
    { id: "LEC-102", fecha: "2026-10-15T06:05:00Z", zona: "Sector B", sensor: "humedad", valor: 35.0, unidad: "%" },
    { id: "LEC-103", fecha: "2026-10-15T06:10:00Z", zona: "Sector C", sensor: "luminosidad", valor: 950.0, unidad: "Lux", nota: "Sol directo" },
    { id: "LEC-104", fecha: "2026-10-15T06:15:00Z", zona: "Sector A", sensor: "temperatura", valor: 25.0, unidad: "°C" },
    { id: "LEC-ERR-01", fecha: "2026-10-15T06:20:00Z", zona: "Zona D", sensor: "temperatura", valor: "25.0", unidad: "°C" },
    { id: "LEC-ERR-02", fecha: "2026-10-15T06:25:00Z", zona: "Zona E", sensor: "presion", valor: 1013, unidad: "hPa" },
    { fecha: "2026-10-15T06:30:00Z", zona: "Zona F", sensor: "humedad", valor: 50, unidad: "%" }
];
console.log("Iniciando monitor de invernadero...\n");
// 1. Validar lote de entrada
const aceptadas = [];
let rechazadas = 0;
console.log("Procesamiento de datos recibidos:");
loteExterno.forEach((item, i) => {
    const res = validarLectura(item);
    if (res.exito) {
        console.log(`  Entrada ${i + 1} (${res.lectura.id}): Aceptada`);
        aceptadas.push(res.lectura);
    }
    else {
        rechazadas++;
        console.log(`  Entrada ${i + 1}: Rechazada - ${res.razon}`);
    }
});
// 2. Clasificación de estado
console.log("\nEvaluación de lecturas válidas:");
const clasificadas = aceptadas.map((l) => ({
    ...l,
    estado: clasificarLectura(l, RANGOS[l.sensor])
}));
clasificadas.forEach((l) => {
    const nota = l.nota ? ` (${l.nota})` : "";
    console.log(`- [${l.estado.toUpperCase()}] ${l.id} | ${l.zona} | ${l.sensor}: ${l.valor} ${l.unidad}${nota}`);
    console.log(`  Acción: ${obtenerProtocoloAccion(l.estado)}`);
});
// 3. Obtención del valor máximo sin mutar el arreglo
const copiaOrdenada = [...clasificadas].sort((a, b) => b.valor - a.valor);
const mayor = copiaOrdenada[0];
if (mayor !== undefined) {
    console.log(`\nValor máximo registrado: ${mayor.id} con ${mayor.valor} ${mayor.unidad}`);
}
// 4. Búsqueda por ID
console.log("\nPruebas de búsqueda:");
const exito = buscarLecturaPorId(aceptadas, "LEC-101");
console.log(`- Búsqueda "LEC-101": ${exito ? `Encontrada en ${exito.zona}` : "No encontrada"}`);
const fallo = buscarLecturaPorId(aceptadas, "LEC-999");
console.log(`- Búsqueda "LEC-999": ${fallo ? `Encontrada en ${fallo.zona}` : "No encontrada (undefined)"}`);
// 5. Resumen consolidado
console.log("\nResumen general:");
console.log(JSON.stringify(generarResumen(clasificadas, rechazadas), null, 2));
