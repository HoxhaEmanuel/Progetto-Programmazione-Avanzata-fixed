import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Middleware to validate email and password for authentication
 */
export const validateEmailPassword = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Email e password sono obbligatorie'));
    }

    if (!isValidEmail(email)) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Formato email non valido'));
    }

    if (password.length < 6) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'La password deve essere di almeno 6 caratteri'));
    }

    next();
};

/**
 * Middleware to validate required fields
 * @param fields - Array of required field names
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = fields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return next(ErrorFactory.createError(ErrorTypes.BadRequest, `I seguenti campi sono obbligatori: ${missingFields.join(', ')}`));
    }
    
    next();
  };
};

// Middleware rimosso: validateArrayFields (non utilizzato nelle rotte)

/**
 * Middleware to validate model grid dimensions
 */
export const validateModelGrid = (req: Request, res: Response, next: NextFunction): void => {
    const { griglia } = req.body;

    if (!Array.isArray(griglia)) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'La griglia deve essere un array'));
    }

    if (griglia.length === 0) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'La griglia non può essere vuota'));
    }

    // Validate that all rows have the same length
    const firstRowLength = griglia[0].length;
    for (let i = 0; i < griglia.length; i++) {
        if (!Array.isArray(griglia[i]) || griglia[i].length !== firstRowLength) {
            return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Tutte le righe della griglia devono avere la stessa lunghezza'));
        }

        // Valida che i valori siano solo 0 o 1
        for (let j = 0; j < firstRowLength; j++) {
            const cellValue = griglia[i][j];
            if (cellValue !== 0 && cellValue !== 1) {
                return next(ErrorFactory.createError(ErrorTypes.BadRequest, 
                    `La griglia può contenere solo valori 0 o 1. Trovato: ${cellValue} alla posizione (${j}, ${i})`));
            }
        }
    }

    next();
};

/**
 * Middleware to validate recharge request body
 */
export const validateRechargeRequest = (req: Request, res: Response, next: NextFunction): void => {
    const { email, nuovoSaldo } = req.body;

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Formato email non valido'));
    }

    if (nuovoSaldo === undefined || typeof nuovoSaldo !== 'number' || nuovoSaldo < 0) {
        return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Il campo nuovoSaldo deve essere un numero non negativo'));
    }

    // Converte a numero per sicurezza, anche se il tipo è già controllato
    req.body.nuovoSaldo = Number(nuovoSaldo);

    next();
};