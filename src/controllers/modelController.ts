import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import modelloDao from '../dao/ModelloDao';
import utenteDao from '../dao/UtenteDao';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { formatTokenBalance } from '../utils/tokenUtils';
import { normalizeCoordinates, validatePathfindingCoordinates } from '../utils/coordinateValidator';
import { AStarFinder } from 'astar-typescript';
import { withTransaction } from '../utils/transactionWrapper';

/**
 * Interfaccia per la richiesta di creazione modello
 */
interface CreateModelRequest {
  nome: string;
  griglia: number[][];
}



/**
 * Crea un nuovo modello di griglia per l'algoritmo A*
 * Costo: 0.05 token per cella
 */
export const createModel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { nome, griglia }: CreateModelRequest = req.body;
    const userId = req.user!.id;

    // Note: Basic validation is now handled by middleware
    // Additional business logic validation
    const righe = griglia.length;
    const colonne = griglia[0].length;

    // Il costo è già stato calcolato e verificato dal middleware
    const costoCreazione = (req as AuthenticatedRequest & { requiredTokens: number }).requiredTokens;

    // Operazione atomica: deduce token prima, poi crea il modello, tutto in transazione
    await withTransaction(async (transaction) => {
      const newBalance = await utenteDao.deductTokensAndGetBalance(userId, costoCreazione, transaction);

      const nuovoModello = await modelloDao.create({
        nome,
        griglia,
        dimensioni_y: righe,
        dimensioni_x: colonne,
        costo_creazione: costoCreazione,
        creatore_id: userId
      }, transaction);

      res.status(StatusCodes.CREATED).json({
        message: 'Modello creato con successo',
        modello: {
          id: nuovoModello.id,
          nome: nuovoModello.nome,
          dimensioni_y: nuovoModello.dimensioni_y,
          dimensioni_x: nuovoModello.dimensioni_x,
          creatore_id: nuovoModello.creatore_id
        },
        costo_creazione: costoCreazione,
        token_rimanenti: formatTokenBalance(newBalance)
      });
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Esegue l'algoritmo A* su un modello esistente
 * Costo: stesso della creazione (0.05 token per cella)
 */
export const executeModel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const modelId = req.modelId!; // Validato dal middleware validateModelId
    const userId = req.user!.id;

    // Recupera il modello
    const modello = await modelloDao.findById(modelId);
    if (!modello) {
      // Questo caso è già gestito da validateAndCheckModelExists, ma per sicurezza
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'Modello non trovato');
    }

    // Normalizza le coordinate di input usando l'utility
    const { start: startPos, goal: goalPos } = normalizeCoordinates(req.body);

    if (!startPos || !goalPos) {
      throw ErrorFactory.createError(ErrorTypes.BadRequest, 
        'Coordinate di partenza e destinazione sono obbligatorie. Formati supportati: {startX, startY, goalX, goalY} oppure {start: {x, y}, goal: {x, y}} o {start: {x, y}, end: {x, y}}');
    }

    // Validazione coordinate centralizzata: limiti griglia e start != goal
    await validatePathfindingCoordinates(modelId, startPos, goalPos);

    // Il costo è già stato calcolato e verificato dal middleware
    const costoEsecuzione = (req as AuthenticatedRequest & { requiredTokens: number }).requiredTokens;

    // Esegui algoritmo A*
    const startTime = Date.now();
    
    const aStarInstance = new AStarFinder({
      grid: {
        matrix: modello.griglia
      },
      diagonalAllowed: true,
      heuristic: 'Manhattan'
    });

    // Le posizioni sono già definite sopra
    
    const percorso = aStarInstance.findPath(startPos, goalPos);
    const endTime = Date.now();
    const tempoEsecuzione = endTime - startTime;

    // Deduzione token e recupero saldo in una singola operazione
    const newBalance = await utenteDao.deductTokensAndGetBalance(userId, costoEsecuzione);

    // Calcola il costo del percorso (numero di passi)
    const costoPercorso = percorso.length > 0 ? percorso.length - 1 : 0;

    res.status(StatusCodes.OK).json({
      success: true,
      modello_id: modelId,
      start: startPos,
      goal: goalPos,
      percorso,
      costo_percorso: costoPercorso,
      tempo_esecuzione_ms: tempoEsecuzione,
      costo_token: costoEsecuzione,
      token_rimanenti: formatTokenBalance(newBalance),
      percorso_trovato: percorso.length > 0
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Verifica lo stato di un modello (se ha richieste pending)
 */
export const getModelStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const modelId = req.modelId!; // Validato dal middleware validateModelId

    // Ottiene modello e conteggio pending in una sola query
    const statusInfo = await modelloDao.getModelStatusInfo(modelId);
    if (!statusInfo) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'Modello non trovato');
    }

    res.status(StatusCodes.OK).json({
      modello_id: modelId,
      nome: statusInfo.modello.nome,
      ha_richieste_pending: statusInfo.pendingRequests > 0,
      numero_richieste_pending: statusInfo.pendingRequests
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene tutti i modelli dell'utente autenticato con paginazione
 */
export const getUserModels = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit: limiteNum, offset, page: paginaNum } = req.pagination!;

    const { rows: modelli, count } = await modelloDao.findByCreatorIdPaginated(
      userId,
      limiteNum,
      offset
    );

    res.status(StatusCodes.OK).json({
      modelli,
      paginazione: {
        pagina_corrente: paginaNum,
        elementi_per_pagina: limiteNum,
        totale_elementi: count,
        totale_pagine: Math.ceil(count / limiteNum)
      }
    });

  } catch (error) {
    next(error);
  }
};