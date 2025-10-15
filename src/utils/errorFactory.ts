/**
 * Factory per la creazione di errori personalizzati.
 * Implementa il pattern Factory per centralizzare la gestione degli errori.
 */

/**
 * Tipi di errori supportati dall'applicazione.
 */
export enum ErrorTypes {
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  UnprocessableEntity = 'UNPROCESSABLE_ENTITY',
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  InsufficientTokens = 'INSUFFICIENT_TOKENS',
  ValidationError = 'VALIDATION_ERROR'
}

/**
 * Classe per errori personalizzati dell'applicazione.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: ErrorTypes;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, type: ErrorTypes, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.isOperational = isOperational;

    // Mantiene lo stack trace corretto
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Factory per la creazione di errori tipizzati.
 */
export class ErrorFactory {
  /**
   * Crea un errore personalizzato basato sul tipo.
   */
  public static createError(type: ErrorTypes, message: string, customStatusCode?: number): AppError {
    const statusCode = customStatusCode || this.getStatusCodeForType(type);
    return new AppError(message, statusCode, type);
  }

  /**
   * Restituisce il codice di stato HTTP appropriato per il tipo di errore.
   */
  private static getStatusCodeForType(type: ErrorTypes): number {
    switch (type) {
      case ErrorTypes.BadRequest:
      case ErrorTypes.ValidationError:
        return 400;
      case ErrorTypes.Unauthorized:
        return 401;
      case ErrorTypes.Forbidden:
        return 403;
      case ErrorTypes.NotFound:
        return 404;
      case ErrorTypes.Conflict:
        return 409;
      case ErrorTypes.UnprocessableEntity:
        return 422;
      case ErrorTypes.InsufficientTokens:
        return 401;
      case ErrorTypes.InternalServerError:
      default:
        return 500;
    }
  }

  /**
   * Crea un errore di validazione con dettagli specifici.
   */
  public static createValidationError(field: string, value: unknown, constraint: string): AppError {
    const message = `Validazione fallita per il campo '${field}' con valore '${value}': ${constraint}`;
    return this.createError(ErrorTypes.ValidationError, message);
  }

  /**
   * Crea un errore per token insufficienti.
   */
  public static createInsufficientTokensError(required: number, available: number): AppError {
    const message = `Token insufficienti. Richiesti: ${required}, Disponibili: ${available}`;
    return this.createError(ErrorTypes.InsufficientTokens, message);
  }

  /**
   * Crea un errore di autorizzazione.
   */
  public static createUnauthorizedError(reason?: string): AppError {
    const message = reason ? `Accesso non autorizzato: ${reason}` : 'Accesso non autorizzato';
    return this.createError(ErrorTypes.Unauthorized, message);
  }

  /**
   * Crea un errore di risorsa non trovata.
   */
  public static createNotFoundError(resource: string, identifier?: string | number): AppError {
    const message = identifier 
      ? `${resource} con identificativo '${identifier}' non trovato`
      : `${resource} non trovato`;
    return this.createError(ErrorTypes.NotFound, message);
  }
}