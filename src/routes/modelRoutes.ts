import { Router } from 'express';
import { 
  createModel, 
  executeModel, 
  getModelStatus, 
  getUserModels 
} from '../controllers/modelController';
import { authenticateToken, requireTokens, calculateModelCreationCost, calculateExecutionCost } from '../middleware/authMiddleware';
import { validateRequiredFields, validateModelGrid } from '../middleware/validationMiddleware';
import { validateAndCheckModelExists, validatePagination } from '../middleware/validateIdMiddleware';

const router = Router();

/**
 * Tutte le rotte dei modelli richiedono autenticazione JWT
 */
router.use(authenticateToken);

/**
 * @route POST /api/models
 * @desc Crea un nuovo modello di griglia
 * @access Private
 * @body { nome: string, griglia: number[][] }
 */
router.post('/', 
  validateRequiredFields(['nome', 'griglia']), 
  validateModelGrid, 
  requireTokens(calculateModelCreationCost), 
  createModel
);

/**
 * @route GET /api/models
 * @desc Ottiene tutti i modelli dell'utente autenticato con paginazione
 * @access Private
 * @query pagina, limite
 */
router.get('/', 
  validatePagination,
  getUserModels
);

/**
 * @route POST /api/models/:id/execute
 * @desc Esegue l'algoritmo A* su un modello
 * @access Private
 * @body Supporta sia chiavi separate che oggetti:
 *        { startX: number, startY: number, goalX: number, goalY: number }
 *        oppure { start: { x: number, y: number }, goal: { x: number, y: number } }
 */
router.post('/:id/execute', 
  validateAndCheckModelExists,
  requireTokens(calculateExecutionCost), 
  executeModel
);

/**
 * @route GET /api/models/:id/status
 * @desc Verifica lo stato di un modello (richieste pending)
 * @access Private
 */
router.get('/:id/status', 
  validateAndCheckModelExists,
  getModelStatus
);

export default router;