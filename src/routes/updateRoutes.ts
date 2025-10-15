import { Router } from 'express';
import { 
  requestCellUpdate,
  getPendingRequests,
  approveRejectRequests,
  getModelUpdates
} from '../controllers/updateController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateAndCheckModelExists, validatePagination } from '../middleware/validateIdMiddleware';

const router = Router();

/**
 * Tutte le rotte degli aggiornamenti richiedono autenticazione JWT
 */
router.use(authenticateToken);

/**
 * @route POST /api/updates/models/:id/request
 * @desc Richiede l'aggiornamento di celle di un modello
 * @access Private
 * @body { celle: [{ x: number, y: number, nuovo_valore: 0|1 }] }
 */
router.post('/models/:id/request', 
  validateAndCheckModelExists,
  requestCellUpdate
);

/**
 * @route GET /api/updates/pending
 * @desc Ottiene tutte le richieste pending per i modelli dell'utente con paginazione
 * @access Private
 * @query pagina, limite
 */
router.get('/pending', 
  validatePagination,
  getPendingRequests
);

/**
 * @route PUT /api/updates/approve-reject
 * @desc Approva o rigetta richieste di aggiornamento (modalità bulk)
 * @access Private
 * @body { richieste: [{ id: number, azione: 'approve'|'reject' }] }
 */
router.put('/approve-reject', 
  approveRejectRequests
);

/**
 * @route GET /api/updates/models/:id/history
 * @desc Ottiene l'elenco degli aggiornamenti di un modello con paginazione
 * @access Private
 * @query data_inizio, data_fine, stato, pagina, limite
 */
router.get('/models/:id/history', 
  validateAndCheckModelExists,
  validatePagination,
  getModelUpdates
);

export default router;