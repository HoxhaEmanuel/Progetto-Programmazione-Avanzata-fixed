import { Transaction } from 'sequelize';
import { modelloDao } from '../dao';
import { ErrorFactory, ErrorTypes } from './errorFactory';

/**
 * Interfaccia per coordinate
 */
export interface Coordinate {
  x: number;
  y: number;
}

/**
 * Interfaccia per coordinate con valore (per aggiornamenti celle)
 */
export interface CoordinateWithValue extends Coordinate {
  nuovo_valore: 0 | 1;
}

/**
 * Valida che le coordinate siano all'interno dei limiti della griglia del modello
 * @param modelId - ID del modello
 * @param coordinates - Array di coordinate da validare
 * @param transaction - Transazione opzionale
 * @throws ErrorFactory se coordinate non valide o modello non trovato
 */
const validateCoordinates = async (
  modelId: number,
  coordinates: Coordinate[],
  transaction?: Transaction
): Promise<void> => {
  // Recupera il modello per ottenere le dimensioni
  const modello = await modelloDao.findById(modelId, transaction);
  if (!modello) {
    throw ErrorFactory.createError(ErrorTypes.NotFound, 'Modello non trovato');
  }

  // Valida ogni coordinata
  for (const coord of coordinates) {
    if (!isValidCoordinate(coord, modello.dimensioni_x, modello.dimensioni_y)) {
      throw ErrorFactory.createError(
        ErrorTypes.BadRequest,
        `Coordinate (${coord.x}, ${coord.y}) fuori dai limiti della griglia (${modello.dimensioni_x}x${modello.dimensioni_y})`
      );
    }
  }
};

/**
 * Valida una singola coordinata contro le dimensioni specificate
 * @param coordinate - Coordinata da validare
 * @param maxX - Dimensione massima X (esclusiva)
 * @param maxY - Dimensione massima Y (esclusiva)
 * @returns true se la coordinata è valida
 */
const isValidCoordinate = (
  coordinate: Coordinate,
  maxX: number,
  maxY: number
): boolean => {
  return (
    coordinate.x >= 0 &&
    coordinate.x < maxX &&
    coordinate.y >= 0 &&
    coordinate.y < maxY &&
    Number.isInteger(coordinate.x) &&
    Number.isInteger(coordinate.y)
  );
};

/**
 * Valida coordinate per pathfinding (start e goal)
 * @param modelId - ID del modello
 * @param start - Coordinata di partenza
 * @param goal - Coordinata di destinazione
 * @param transaction - Transazione opzionale
 * @throws ErrorFactory se coordinate non valide
 */
export const validatePathfindingCoordinates = async (
  modelId: number,
  start: Coordinate,
  goal: Coordinate,
  transaction?: Transaction
): Promise<void> => {
  await validateCoordinates(modelId, [start, goal], transaction);
  
  // Validazioni aggiuntive per pathfinding
  if (start.x === goal.x && start.y === goal.y) {
    throw ErrorFactory.createError(
      ErrorTypes.BadRequest,
      'Le coordinate di partenza e destinazione non possono essere uguali'
    );
  }
};

/**
 * Valida celle per aggiornamento con controllo valori
 * @param modelId - ID del modello
 * @param celle - Array di celle con nuovi valori
 * @param transaction - Transazione opzionale
 * @throws ErrorFactory se celle non valide
 */
export const validateCellUpdates = async (
  modelId: number,
  celle: CoordinateWithValue[],
  transaction?: Transaction
): Promise<void> => {
  if (!Array.isArray(celle) || celle.length === 0) {
    throw ErrorFactory.createError(ErrorTypes.BadRequest, 'Array celle non può essere vuoto');
  }

  // Valida coordinate
  await validateCoordinates(modelId, celle, transaction);

  // Valida valori delle celle
  for (const cella of celle) {
    if (cella.nuovo_valore !== 0 && cella.nuovo_valore !== 1) {
      throw ErrorFactory.createError(
        ErrorTypes.BadRequest,
        `Il nuovo valore per la cella (${cella.x}, ${cella.y}) deve essere 0 o 1`
      );
    }
  }

  // Verifica duplicati nelle coordinate
  const coordinateSet = new Set();
  for (const cella of celle) {
    const coordKey = `${cella.x},${cella.y}`;
    if (coordinateSet.has(coordKey)) {
      throw ErrorFactory.createError(
        ErrorTypes.BadRequest,
        `Coordinate duplicate trovate: (${cella.x}, ${cella.y})`
      );
    }
    coordinateSet.add(coordKey);
  }
};

/**
 * Verifica che le celle abbiano effettivamente valori diversi da quelli attuali
 * @param modelId - ID del modello
 * @param celle - Array di celle da verificare
 * @param transaction - Transazione opzionale
 * @returns Array di celle che hanno effettivamente valori diversi
 * @throws ErrorFactory se nessuna cella ha valori diversi
 */
export const filterCellsWithDifferentValues = async (
  modelId: number,
  celle: CoordinateWithValue[],
  transaction?: Transaction
): Promise<CoordinateWithValue[]> => {
  const griglia = await modelloDao.getGrid(modelId, transaction);
  if (!griglia) {
    throw ErrorFactory.createError(ErrorTypes.NotFound, 'Griglia del modello non trovata');
  }

  const celleModificate = celle.filter(cella => {
    const valoreAttuale = griglia[cella.y][cella.x];
    return valoreAttuale !== cella.nuovo_valore;
  });

  if (celleModificate.length === 0) {
    throw ErrorFactory.createError(
      ErrorTypes.BadRequest,
      'Nessuna delle celle specificate ha un valore diverso da quello attuale'
    );
  }

  return celleModificate;
};

/**
 * Utility per convertire coordinate da diversi formati di input
 * Supporta:
 * - {startX, startY, goalX, goalY}
 * - {start: {x, y}, end: {x, y}}
 * - {start: {x, y}, goal: {x, y}}
 */
export const normalizeCoordinates = (input: {
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  goal?: { x: number; y: number };
  startX?: number;
  startY?: number;
  goalX?: number;
  goalY?: number;
}): { start?: Coordinate; goal?: Coordinate } => {
  const result: { start?: Coordinate; goal?: Coordinate } = {};

  // Formato {start: {x, y}, end: {x, y}}
  if (input.start && typeof input.start === 'object') {
    result.start = { x: input.start.x, y: input.start.y };
  }
  if (input.end && typeof input.end === 'object') {
    result.goal = { x: input.end.x, y: input.end.y };
  }

  // Formato {start: {x, y}, goal: {x, y}}
  if (input.goal && typeof input.goal === 'object') {
    result.goal = { x: input.goal.x, y: input.goal.y };
  }

  // Formato {startX, startY, goalX, goalY}
  if (input.startX !== undefined && input.startY !== undefined) {
    result.start = { x: input.startX, y: input.startY };
  }
  if (input.goalX !== undefined && input.goalY !== undefined) {
    result.goal = { x: input.goalX, y: input.goalY };
  }

  return result;
};