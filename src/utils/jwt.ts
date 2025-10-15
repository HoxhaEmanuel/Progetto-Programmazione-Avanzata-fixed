import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ErrorFactory, ErrorTypes } from './errorFactory';

dotenv.config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('La chiave segreta JWT_SECRET non è definita nel file .env');
}

/**
 * Genera un token JWT con durata di 1 ora.
 */
export const generateToken = (payload: object): string => {
  try {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw ErrorFactory.createError(ErrorTypes.InternalServerError, 'Errore nella generazione del token');
  }
};

// Metodo rimosso: verifyToken (non utilizzato, il middleware usa direttamente jsonwebtoken)