import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorFactory';

/**
 * Middleware per la gestione centralizzata degli errori.
 * Implementa il pattern Chain of Responsibility per la gestione degli errori.
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => { // eslint-disable-line @typescript-eslint/no-unused-vars
  // Log dell'errore per debugging (solo se non siamo in ambiente di test)
  if (process.env.NODE_ENV !== 'test') {
    console.error('🚨 Errore catturato dal middleware:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Se è un errore personalizzato dell'applicazione
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        type: err.type,
        message: err.message,
        statusCode: err.statusCode
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Gestione errori di validazione di Sequelize
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = (err as unknown as { errors: Array<{ path: string; message: string; value: unknown }> }).errors.map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    res.status(400).json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Errori di validazione',
        details: validationErrors
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Gestione errori di constraint unici di Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      error: {
        type: 'CONFLICT',
        message: 'Violazione di vincolo di unicità',
        details: (err as unknown as { errors?: Array<{ message: string }> }).errors?.map((error) => error.message) || []
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Gestione errori di connessione al database
  if (err.name === 'SequelizeConnectionError') {
    res.status(503).json({
      success: false,
      error: {
        type: 'DATABASE_CONNECTION_ERROR',
        message: 'Errore di connessione al database'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Gestione errori JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        type: 'INVALID_TOKEN',
        message: 'Token JWT non valido'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        type: 'TOKEN_EXPIRED',
        message: 'Token JWT scaduto'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Errore generico del server
  res.status(500).json({
    success: false,
    error: {
      type: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Errore interno del server'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware per gestire le rotte non trovate.
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => { // eslint-disable-line @typescript-eslint/no-unused-vars
  res.status(404).json({
    success: false,
    error: {
      type: 'NOT_FOUND',
      message: `Rotta ${req.method} ${req.path} non trovata`
    },
    timestamp: new Date().toISOString()
  });
};