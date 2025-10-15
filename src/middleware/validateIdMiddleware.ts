import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { modelloDao } from '../dao';

/**
 * Estende AuthenticatedRequest con ID validati
 */
export interface ValidatedRequest extends AuthenticatedRequest {
  modelId?: number;
  requestId?: number;
}

/**
 * Middleware per validare e parsare l'ID del modello dai parametri URL
 * Elimina la duplicazione di parseInt(req.params.id) in tutti i controller
 */
// Middleware rimosso: validateModelId (non utilizzato)

/**
 * Middleware per validare l'ID del modello e verificare che esista
 * Combina validazione + esistenza in un singolo middleware
 */
export const validateAndCheckModelExists = async (req: ValidatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const modelId = parseInt(req.params.id);
    
    if (isNaN(modelId) || modelId <= 0) {
      return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'ID modello non valido'));
    }
    
    // Verifica esistenza modello
    const modello = await modelloDao.findById(modelId);
    if (!modello) {
      return next(ErrorFactory.createError(ErrorTypes.NotFound, 'Modello non trovato'));
    }
    
    req.modelId = modelId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware per validare l'ID della richiesta dai parametri URL
 */
// Middleware rimosso: validateRequestId (non utilizzato)

/**
 * Middleware per validare array di ID numerici nel body
 * Utile per operazioni bulk
 */
// Middleware rimosso: validateIdArray (non utilizzato)

/**
 * Middleware per validare parametri di paginazione
 */
export const validatePagination = (req: ValidatedRequest, res: Response, next: NextFunction): void => {
  const { pagina = 1, limite = 20 } = req.query;
  
  const paginaNum = parseInt(pagina as string);
  const limiteNum = parseInt(limite as string);
  
  if (isNaN(paginaNum) || paginaNum < 1) {
    return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Numero pagina deve essere >= 1'));
  }
  
  if (isNaN(limiteNum) || limiteNum < 1 || limiteNum > 100) {
    return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Limite deve essere tra 1 e 100'));
  }
  
  // Aggiungi parametri validati alla request
  req.pagination = {
    page: paginaNum,
    limit: limiteNum,
    offset: (paginaNum - 1) * limiteNum
  };
  
  next();
};

/**
 * Estende ValidatedRequest con parametri di paginazione
 */
declare module './validateIdMiddleware' {
  interface ValidatedRequest {
    pagination?: {
      page: number;
      limit: number;
      offset: number;
    };
  }
}