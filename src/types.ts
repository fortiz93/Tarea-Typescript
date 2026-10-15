export type TipoSensor = "temperatura" | "humedad" | "luminosidad";
export type EstadoLectura = "estable" | "atencion" | "critico";
export type RangoMetrica = [min: number, max: number]; // Tupla etiquetada

export interface Lectura {
  readonly id: string;
  readonly fecha: string;
  readonly zona: string;
  readonly sensor: TipoSensor;
  readonly valor: number;
  readonly unidad: string;
  nota?: string;
}

export type LecturaConEstado = Lectura & { readonly estado: EstadoLectura };

export type ResultadoValidacion =
  | { readonly exito: true; readonly lectura: Lectura }
  | { readonly exito: false; readonly razon: string; readonly datoOriginal: unknown };

export interface ResumenInvernadero {
  readonly totalAceptadas: number;
  readonly totalRechazadas: number;
  readonly conteoPorEstado: Record<EstadoLectura, number>;
  readonly promediosPorSensor: Record<TipoSensor, number>;
}