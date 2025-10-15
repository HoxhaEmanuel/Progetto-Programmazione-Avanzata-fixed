import express from 'express';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandlerMiddleware';
import authRoutes from './routes/authRoutes';
import modelRoutes from './routes/modelRoutes';
import updateRoutes from './routes/updateRoutes';
import adminRoutes from './routes/adminRoutes';

// Carica le variabili d'ambiente dal file .env
dotenv.config();

const app = express();

// Middleware per il parsing del corpo delle richieste in formato JSON
app.use(express.json());

// Collega le rotte di autenticazione al prefisso /api/auth
// Tutte le rotte in authRoutes inizieranno con /api/auth
app.use('/api/auth', authRoutes);

// Collega le rotte dei modelli al prefisso /api/models
app.use('/api/models', modelRoutes);

// Collega le rotte degli aggiornamenti al prefisso /api/updates
app.use('/api/updates', updateRoutes);

// Collega le rotte di amministrazione al prefisso /api/admin
app.use('/api/admin', adminRoutes);

// Middleware per gestire le rotte non trovate
// Si attiva solo se nessuna delle rotte precedenti ha risposto
app.use(notFoundHandler);

// Middleware per la gestione centralizzata degli errori
app.use(errorHandler);

export default app;
