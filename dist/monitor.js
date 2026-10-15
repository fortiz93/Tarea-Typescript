const SENSORES_VALIDOS = ["temperatura", "humedad", "luminosidad"];
// Micro-guards reutilizables para evitar duplicación de código de validación
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isNum = (v) => typeof v === "number" && !Number.isNaN(v);
const isSensor = (v) => typeof v === "string" && SENSORES_VALIDOS.includes(v);
const isDate = (v) => typeof v === "string" && !isNaN(Date.parse(v));
//Validador estricto para tipo 'unknown' sin 'any' ni librerías externas.
export function validarLectura(entrada) {
    if (typeof entrada !== "object" || entrada === null) {
        return { exito: false, razon: "Entrada no es un objeto válido.", datoOriginal: entrada };
    }
    const o = entrada;
    if (!isStr(o["id"]))
        return { exito: false, razon: "Propiedad 'id' faltante o vacía.", datoOriginal: entrada };
    if (!isDate(o["fecha"]))
        return { exito: false, razon: "Propiedad 'fecha' inválida o ausente.", datoOriginal: entrada };
    if (!isStr(o["zona"]))
        return { exito: false, razon: "Propiedad 'zona' faltante o vacía.", datoOriginal: entrada };
    if (!isSensor(o["sensor"]))
        return { exito: false, razon: `Sensor no permitido: '${String(o["sensor"])}'.`, datoOriginal: entrada };
    if (!isNum(o["valor"]))
        return { exito: false, razon: "Propiedad 'valor' faltante o no numérica.", datoOriginal: entrada };
    if (!isStr(o["unidad"]))
        return { exito: false, razon: "Propiedad 'unidad' faltante o vacía.", datoOriginal: entrada };
    const lectura = {
        id: o["id"],
        fecha: o["fecha"],
        zona: o["zona"],
        sensor: o["sensor"],
        valor: o["valor"],
        unidad: o["unidad"]
    };
    // exactOptionalPropertyTypes
    if ("nota" in o && o["nota"] !== undefined) {
        if (typeof o["nota"] === "string")
            lectura.nota = o["nota"];
        else
            return { exito: false, razon: "La nota opcional debe ser un string.", datoOriginal: entrada };
    }
    return { exito: true, lectura };
}
//Clasificación mediante destructuring directo de la tupla [min, max]
export function clasificarLectura(lectura, [min, max]) {
    const { valor } = lectura;
    if (valor < min - 5 || valor > max + 10)
        return "critico";
    if (valor < min || valor > max)
        return "atencion";
    return "estable";
}
export function assertExhaustive(valor) {
    throw new Error(`Estado no contemplado en compilación: ${JSON.stringify(valor)}`);
}
// Map de lookup para simplificar el switch extenso y mantener OCP
const PROTOCOLOS = {
    estable: "Operación normal: Sin ajustes requeridos.",
    atencion: "Advertencia: Inspeccionar calibración y parámetros del sector.",
    critico: "ALERTA CRÍTICA: Activar actuadores e intervención manual inmediata."
};
//Demuestra narrowing estricto y exhaustividad comprobada por el compilador.
export function obtenerProtocoloAccion(estado) {
    switch (estado) {
        case "estable":
            return "Operación normal: Sin ajustes requeridos.";
        case "atencion":
            return "Advertencia: Inspeccionar calibración y parámetros del sector.";
        case "critico":
            return "ALERTA CRÍTICA: Activar actuadores e intervención manual inmediata.";
        default:
            // Aquí 'estado' ha sido reducido a tipo 'never' por el compilador
            return assertExhaustive(estado);
    }
}
//Resumen consolidado procesado en una sola pasada O(N)
export function generarResumen(lecturas, totalRechazadas) {
    const conteoPorEstado = { estable: 0, atencion: 0, critico: 0 };
    const acumuladores = {
        temperatura: { suma: 0, total: 0 },
        humedad: { suma: 0, total: 0 },
        luminosidad: { suma: 0, total: 0 }
    };
    lecturas.forEach(({ estado, sensor, valor }) => {
        conteoPorEstado[estado]++;
        acumuladores[sensor].suma += valor;
        acumuladores[sensor].total++;
    });
    const promediosPorSensor = SENSORES_VALIDOS.reduce((acc, sensor) => {
        const { suma, total } = acumuladores[sensor];
        acc[sensor] = total > 0 ? Number((suma / total).toFixed(2)) : 0;
        return acc;
    }, {});
    return { totalAceptadas: lecturas.length, totalRechazadas, conteoPorEstado, promediosPorSensor };
}
export function buscarLecturaPorId(lecturas, id) {
    return lecturas.find((l) => l.id === id);
}
