import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import utenteDao from '../dao/UtenteDao';
import modelloDao from '../dao/ModelloDao';
import richiestaAggiornamentoDao from '../dao/RichiestaAggiornamentoDao';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { formatTokenBalance } from '../utils/tokenUtils';

/**
 * Interfaccia per la richiesta di ricarica token
 */
interface RechargeTokensRequest {
  email: string;
  nuovoSaldo: number;
}

/**
 * Ricarica i token di un utente (solo per admin)
 * @route POST /api/admin/recharge
 */
export const rechargeUserTokens = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // La validazione è ora gestita dal middleware validateRechargeRequest
    const { email, nuovoSaldo }: RechargeTokensRequest = req.body;

    // Trova l'utente da ricaricare
    const targetUser = await utenteDao.findByEmail(email);
    if (!targetUser) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 
        `Utente con email ${email} non trovato`);
    }

    const saldoPrecedente = targetUser.token_rimanenti;
    const saldoPrecedenteFormatted = formatTokenBalance(saldoPrecedente);

    // Aggiorna il saldo
    await utenteDao.updateTokens(targetUser.id, nuovoSaldo);

    res.status(StatusCodes.OK).json({
      message: 'Saldo aggiornato con successo',
      utente: {
        id: targetUser.id,
        email: targetUser.email,
        saldo_precedente: saldoPrecedenteFormatted,
        token_rimanenti: nuovoSaldo,
        differenza: nuovoSaldo - saldoPrecedente
      },
      operazione_effettuata_da: {
        admin_id: req.user!.id,
        admin_email: req.user!.email
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene statistiche generali del sistema (solo per admin)
 * @route GET /api/admin/stats
 */
export const getSystemStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Ottieni statistiche del sistema
    const [totalUtenti, totalModelli, requestStats] = await Promise.all([
      utenteDao.count(),
      modelloDao.count(),
      richiestaAggiornamentoDao.getStats()
    ]);

    // Calcola token totali nel sistema
    const totalTokens = await utenteDao.getTotalTokensInSystem();

    res.status(StatusCodes.OK).json({
      utenti: {
        totale: totalUtenti
      },
      modelli: {
        totale: totalModelli
      },
      richieste_aggiornamento: requestStats,
      economia: {
        token_totali_sistema: totalTokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene la lista di tutti gli utenti con i loro saldi (solo per admin)
 * @route GET /api/admin/users
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // I parametri di paginazione sono già validati e forniti dal middleware validatePagination
    const { limit: limiteNum, offset, page: paginaNum } = req.pagination!;
    const { count, rows: utenti } = await utenteDao.findAllWithPagination(limiteNum, offset);

    // Converti token_rimanenti a numeri
    const utentiFormatted = utenti.map(utente => ({
      ...utente.toJSON(),
      token_rimanenti: formatTokenBalance(utente.token_rimanenti)
    }));

    res.status(StatusCodes.OK).json({
      utenti: utentiFormatted,
      paginazione: {
        pagina_corrente: paginaNum,
        elementi_per_pagina: limiteNum,
        totale_elementi: count,
        totale_pagine: Math.ceil(count / limiteNum)
      }
    });

  } catch (error) {
    next(error);
  }
};