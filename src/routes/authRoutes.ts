import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { validateEmailPassword } from '../middleware/validationMiddleware';

const router = Router();

// Definisce la rotta POST per il login
router.post('/login', validateEmailPassword, login);

// Aggiungiamo anche la rotta per la registrazione
router.post('/register', validateEmailPassword, register);

export default router;

