import type {
  Lectura,
  LecturaConEstado,
  TipoSensor,
  EstadoLectura,
  RangoMetrica,
  ResultadoValidacion,
  ResumenInvernadero
} from "./types.js";

const SENSORES_VALIDOS: readonly TipoSensor[] = ["temperatura", "humedad", "luminosidad"];

// Micro-guards reutilizables para evitar duplicación de código de validación
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);
const isSensor = (v: unknown): v is TipoSensor => typeof v === "string" && SENSORES_VALIDOS.includes(v as TipoSensor);
const isDate = (v: unknown): boolean => typeof v === "string" && !isNaN(Date.parse(v));

//Validador estricto para tipo 'unknown' sin 'any' ni librerías externas.
export function validarLectura(entrada: unknown): ResultadoValidacion {
  if (typeof entrada !== "object" || entrada === null) {
    return { exito: false, razon: "Entrada no es un objeto válido.", datoOriginal: entrada };
  }

  const o = entrada as Record<string, unknown>;

  if (!isStr(o["id"])) return { exito: false, razon: "Propiedad 'id' faltante o vacía.", datoOriginal: entrada };
  if (!isDate(o["fecha"])) return { exito: false, razon: "Propiedad 'fecha' inválida o ausente.", datoOriginal: entrada };
  if (!isStr(o["zona"])) return { exito: false, razon: "Propiedad 'zona' faltante o vacía.", datoOriginal: entrada };
  if (!isSensor(o["sensor"])) return { exito: false, razon: `Sensor no permitido: '${String(o["sensor"])}'.`, datoOriginal: entrada };
  if (!isNum(o["valor"])) return { exito: false, razon: "Propiedad 'valor' faltante o no numérica.", datoOriginal: entrada };
  if (!isStr(o["unidad"])) return { exito: false, razon: "Propiedad 'unidad' faltante o vacía.", datoOriginal: entrada };

  const lectura: Lectura = {
    id: o["id"],
    fecha: o["fecha"] as string,
    zona: o["zona"],
    sensor: o["sensor"],
    valor: o["valor"],
    unidad: o["unidad"]
  };

  // exactOptionalPropertyTypes
  if ("nota" in o && o["nota"] !== undefined) {
    if (typeof o["nota"] === "string") lectura.nota = o["nota"];
    else return { exito: false, razon: "La nota opcional debe ser un string.", datoOriginal: entrada };
  }

  return { exito: true, lectura };
}

//Clasificación mediante destructuring directo de la tupla [min, max]
export function clasificarLectura(lectura: Lectura, [min, max]: RangoMetrica): EstadoLectura {
  const { valor } = lectura;
  if (valor < min - 5 || valor > max + 10) return "critico";
  if (valor < min || valor > max) return "atencion";
  return "estable";
}

export function assertExhaustive(valor: never): never {
  throw new Error(`Estado no contemplado en compilación: ${JSON.stringify(valor)}`);
}

// Map de lookup para simplificar el switch extenso y mantener OCP
const PROTOCOLOS: Record<EstadoLectura, string> = {
  estable: "Operación normal: Sin ajustes requeridos.",
  atencion: "Advertencia: Inspeccionar calibración y parámetros del sector.",
  critico: "ALERTA CRÍTICA: Activar actuadores e intervención manual inmediata."
};

//Demuestra narrowing estricto y exhaustividad comprobada por el compilador.
export function obtenerProtocoloAccion(estado: EstadoLectura): string {
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
export function generarResumen(lecturas: readonly LecturaConEstado[], totalRechazadas: number): ResumenInvernadero {
  const conteoPorEstado: Record<EstadoLectura, number> = { estable: 0, atencion: 0, critico: 0 };
  const acumuladores: Record<TipoSensor, { suma: number; total: number }> = {
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
  }, {} as Record<TipoSensor, number>);

  return { totalAceptadas: lecturas.length, totalRechazadas, conteoPorEstado, promediosPorSensor };
}

export function buscarLecturaPorId(lecturas: readonly Lectura[], id: string): Lectura | undefined {
  return lecturas.find((l) => l.id === id);
}