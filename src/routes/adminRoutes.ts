import { Router } from 'express';
import { 
  rechargeUserTokens,
  getSystemStats,
  getAllUsers
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { validatePagination } from '../middleware/validateIdMiddleware';
import { validateRechargeRequest } from '../middleware/validationMiddleware';

const router = Router();

/**
 * Tutte le rotte admin richiedono autenticazione JWT e ruolo admin
 */
router.use(authenticateToken);
router.use(requireAdmin);


/**
 * @route POST /api/admin/recharge
 * @desc Ricarica i token di un utente
 * @access Admin only
 * @body { email: string, nuovoSaldo: number }
 */
router.post('/recharge', validateRechargeRequest, rechargeUserTokens);

/**
 * @route GET /api/admin/stats
 * @desc Ottiene statistiche generali del sistema
 * @access Admin only
 */
router.get('/stats', getSystemStats);

/**
 * @route GET /api/admin/users
 * @desc Ottiene la lista di tutti gli utenti
 * @access Admin only
 * @query pagina, limite
 */
router.get('/users', validatePagination, getAllUsers);

export default router;