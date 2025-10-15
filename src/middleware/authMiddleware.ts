import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { utenteDao } from '../dao';
import { calculateModelCreationCost as calcCreationCostUtil } from '../utils/tokenUtils';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

/**
 * Interfaccia per estendere Request con i dati dell'utente autenticato e ID validati
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    token_rimanenti: number;
    ruolo: string;
  };
  requiredTokens?: number;
  // ID validati dai middleware
  modelId?: number;
  requestId?: number;
  userId?: number;
  // Paginazione validata
  pagination?: {
    page: number;
    limit: number;
    offset: number;
  };
}

/**
 * Middleware per verificare l'autenticazione JWT
 * Estrae il token dall'header Authorization e verifica la validità
 */
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Token di accesso richiesto'));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(ErrorFactory.createError(ErrorTypes.InternalServerError, 'Configurazione JWT mancante'));
    }

    // Verifica il token JWT
    const decoded = jwt.verify(token, jwtSecret) as { 
      id: number; 
      email: string; 
      ruolo: string;
      iat: number;
      exp: number;
    };
    
    // Recupera i dati aggiornati dell'utente dal database
    const user = await utenteDao.findById(decoded.id);
    if (!user) {
      return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Utente non trovato'));
    }

    // Aggiungi i dati dell'utente alla richiesta
    req.user = {
      id: user.id,
      email: user.email,
      token_rimanenti: Number(user.token_rimanenti),
      ruolo: user.ruolo
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Token non valido'));
    }
    next(error);
  }
};

/**
 * Middleware per verificare che l'utente abbia ruolo admin
 */
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Autenticazione richiesta'));
    }

    if (req.user.ruolo !== 'admin') {
      return next(ErrorFactory.createError(ErrorTypes.Forbidden, 'Accesso negato: privilegi di amministratore richiesti'));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware per verificare che l'utente abbia token sufficienti
 * @param requiredTokens - Numero di token richiesti per l'operazione, o funzione per calcolo dinamico
 */
export const requireTokens = (requiredTokens: number | ((req: AuthenticatedRequest) => Promise<number>)) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Autenticazione richiesta'));
      }

      // Calcola i token richiesti (statico o dinamico)
      const tokensNeeded = typeof requiredTokens === 'function' 
        ? await requiredTokens(req)
        : requiredTokens;

      if (req.user.token_rimanenti < tokensNeeded) {
        return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 
          `Token insufficienti. Richiesti: ${tokensNeeded}, Disponibili: ${req.user.token_rimanenti}`));
      }

      // Salva i token richiesti nella request per uso nei controller
      req.requiredTokens = tokensNeeded;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Funzioni helper per calcolare i costi dinamici
 */
export const calculateModelCreationCost = async (req: AuthenticatedRequest): Promise<number> => {
  const { griglia } = req.body;
  if (!griglia || !Array.isArray(griglia) || !Array.isArray(griglia[0])) {
    throw new Error('Griglia non valida per calcolo costo');
  }
  const height = griglia.length;
  const width = griglia[0].length;
  return calcCreationCostUtil(width, height);
};

// Nota: il costo di aggiornamento è calcolato nel controller usando tokenUtils

export const calculateExecutionCost = async (req: AuthenticatedRequest): Promise<number> => {
  const modelId = parseInt(req.params.id);
  const { modelloDao } = await import('../dao');
  const modello = await modelloDao.findById(modelId);
  if (!modello) {
    throw new Error('Modello non trovato per calcolo costo');
  }
  return modello.costo_creazione;
};