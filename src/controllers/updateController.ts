import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { withTransaction } from '../utils/transactionWrapper';
import richiestaAggiornamentoDao from '../dao/RichiestaAggiornamentoDao';
import modelloDao from '../dao/ModelloDao';
import cellaAggiornamentoDao from '../dao/CellaAggiornamentoDao';
import utenteDao from '../dao/UtenteDao';
import { validateCellUpdates, filterCellsWithDifferentValues } from '../utils/coordinateValidator';
import { formatTokenBalance, calculateUpdateCost } from '../utils/tokenUtils';

/**
 * Interfaccia per la richiesta di aggiornamento celle
 */
interface UpdateCellsRequest {
  celle: {
    x: number;
    y: number;
    nuovo_valore: 0 | 1;
  }[];
}

/**
 * Interfaccia per l'approvazione/rigetto di richieste
 */
interface ApproveRejectRequest {
  richieste: {
    id: number;
    azione: 'approve' | 'reject';
  }[];
}

/**
 * Richiede l'aggiornamento di una o più celle di un modello
 * Costo: 0.35 token per cella
 */
export const requestCellUpdate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await withTransaction(async (transaction) => {
    const modelId = req.modelId!; // Validato dal middleware validateModelId
    const { celle }: UpdateCellsRequest = req.body;
    const userId = req.user!.id;

    // Validazione input
    if (!celle || !Array.isArray(celle) || celle.length === 0) {
      throw ErrorFactory.createError(ErrorTypes.BadRequest, 'Celle da aggiornare sono obbligatorie');
    }

    // Recupera il modello
    const modello = await modelloDao.findById(modelId, transaction);
    if (!modello) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'Modello non trovato');
    }

    // Validazione coordinate usando utility centralizzata
    await validateCellUpdates(modelId, celle, transaction);

    // Filtra le celle che hanno effettivamente un valore diverso, centralizzando la logica
    const celleDaAggiornare = await filterCellsWithDifferentValues(modelId, celle, transaction);

    const user = await utenteDao.findById(userId, transaction);

    // Verifica se l'utente è il creatore del modello
    const isCreatore = await modelloDao.isCreator(modelId, userId);
    
    // Calcola il costo reale basato solo sulle celle che necessitano aggiornamento, centralizzato
    const costoAggiornamento = calculateUpdateCost(celleDaAggiornare.length, isCreatore);
    
    if (isCreatore) {
      // Applica direttamente le modifiche senza costi per il creatore
      const grigliaAttuale = await modelloDao.getGrid(modelId, transaction);
      const nuovaGriglia = JSON.parse(JSON.stringify(grigliaAttuale));

      for (const cella of celleDaAggiornare) {
        nuovaGriglia[cella.y][cella.x] = cella.nuovo_valore;
      }

      await modelloDao.updateGrid(modelId, nuovaGriglia, transaction);
      // I creatori non pagano per modificare le proprie griglie
      
      res.status(StatusCodes.OK).json({
        messaggio: 'Aggiornamento applicato direttamente',
        modello_id: modelId,
        celle_aggiornate: celleDaAggiornare.length,
        costo_token: 0, // Nessun costo per il creatore
        token_rimanenti: formatTokenBalance(user!.token_rimanenti)
      });
    } else {
      // Per i non-creatori, sottrai i token PRIMA di qualsiasi operazione DB
      // Questo elimina la doppia validazione e previene operazioni inutili
      const nuovoSaldo = await utenteDao.deductTokensAndGetBalance(userId, costoAggiornamento, transaction);

      // Crea richiesta di aggiornamento (solo dopo aver confermato il pagamento)
      const richiesta = await richiestaAggiornamentoDao.create({
        stato: 'pending',
        modello_id: modelId,
        richiedente_id: userId,
        costo_totale: costoAggiornamento
      }, transaction);

      // Crea le celle di aggiornamento solo per quelle che cambiano
      const celleAggiornamento = celleDaAggiornare.map(cella => ({
        x: cella.x,
        y: cella.y,
        nuovo_valore: cella.nuovo_valore,
        richiesta_id: richiesta.id,
      }));

      await cellaAggiornamentoDao.bulkCreate(celleAggiornamento, transaction);
      
      res.status(StatusCodes.CREATED).json({
        messaggio: 'Richiesta di aggiornamento creata',
        richiesta_id: richiesta.id,
        modello_id: modelId,
        celle_richieste: celleDaAggiornare.length,
        costo_token: costoAggiornamento,
        token_rimanenti: formatTokenBalance(nuovoSaldo),
        stato: 'pending'
      });
    }

    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene tutte le richieste pending per i modelli dell'utente autenticato con paginazione
 */
export const getPendingRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit: limiteNum, offset, page: paginaNum } = req.pagination!;

    const { rows: richiestePending, count } = await richiestaAggiornamentoDao.findPendingByCreatorIdPaginated(
      userId,
      limiteNum,
      offset
    );

    res.status(StatusCodes.OK).json({
      richieste_pending: richiestePending,
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

/**
 * Approva o rigetta richieste di aggiornamento (modalità bulk ottimizzata)
 * Utilizza bulk operations per eliminare problemi N+1
 */
export const approveRejectRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await withTransaction(async (transaction) => {
      const { richieste }: ApproveRejectRequest = req.body;
      const userId = req.user!.id;

      if (!richieste || !Array.isArray(richieste) || richieste.length === 0) {
        throw ErrorFactory.createError(ErrorTypes.BadRequest, 'Lista richieste è obbligatoria');
      }

      // Estrai tutti gli ID delle richieste
      const richiesteIds = richieste.map(r => r.id).filter(id => id && !isNaN(id));
      
      if (richiesteIds.length === 0) {
        throw ErrorFactory.createError(ErrorTypes.BadRequest, 'Nessun ID richiesta valido fornito');
      }

      // Recupera tutte le richieste in una singola query (bulk operation)
      const richiesteData = await richiestaAggiornamentoDao.findMultipleByIdsWithRelations(richiesteIds, transaction);
      
      // Crea mappa per accesso rapido
      const richiesteMap = new Map(richiesteData.map(r => [r.id, r]));
      
      // Estrai tutti gli ID unici dei modelli per il controllo bulk delle autorizzazioni
      const modelIds = [...new Set(richiesteData.map(r => r.modello_id))];
      
      // Verifica la proprietà di tutti i modelli in una singola query (risolve N+1)
      const ownershipMap = await modelloDao.checkMultipleOwnership(modelIds, userId, transaction);
      
      const risultati: Array<{ richiesta_id: number; stato?: string; celle_aggiornate?: number; errore?: string }> = [];
      const approvals: Array<{ id: number; modello_id: number; celle: Array<{ x: number; y: number; nuovo_valore: number }> }> = [];
      const rejections: number[] = [];
      const modelGridUpdates = new Map<number, { griglia: number[][]; celle: Array<{ x: number; y: number; nuovo_valore: number }> }>();

      // Processa ogni richiesta e raggruppa per tipo di azione
      for (const richiestaInput of richieste) {
        const { id: richiestaId, azione } = richiestaInput;

        if (!richiestaId || (azione !== 'approve' && azione !== 'reject')) {
          risultati.push({ 
            richiesta_id: richiestaId, 
            errore: 'ID richiesta e azione (approve/reject) sono obbligatori' 
          });
          continue;
        }

        const richiesta = richiesteMap.get(richiestaId);
        if (!richiesta) {
          risultati.push({ richiesta_id: richiestaId, errore: 'Richiesta non trovata' });
          continue;
        }

        // Verifica che il modello e le celle siano caricate
        if (!richiesta.modello || !richiesta.celle) {
          risultati.push({ richiesta_id: richiestaId, errore: 'Dati richiesta incompleti' });
          continue;
        }

        // Verifica che l'utente sia il creatore del modello (usando mappa pre-calcolata)
        if (!ownershipMap.get(richiesta.modello_id)) {
          risultati.push({ richiesta_id: richiestaId, errore: 'Non autorizzato per questo modello' });
          continue;
        }

        // Verifica che la richiesta sia in stato pending
        if (richiesta.stato !== 'pending') {
          risultati.push({ richiesta_id: richiestaId, errore: `Richiesta già ${richiesta.stato}` });
          continue;
        }

        if (azione === 'approve') {
          approvals.push({
            id: richiesta.id,
            modello_id: richiesta.modello_id,
            celle: richiesta.celle!
          });
          
          // Prepara aggiornamenti griglia per batch
          if (!modelGridUpdates.has(richiesta.modello_id)) {
            const grigliaAttuale = await modelloDao.getGrid(richiesta.modello_id, transaction);
            modelGridUpdates.set(richiesta.modello_id, {
              griglia: JSON.parse(JSON.stringify(grigliaAttuale)),
              celle: []
            });
          }
          
          const gridUpdate = modelGridUpdates.get(richiesta.modello_id)!;
          gridUpdate.celle.push(...richiesta.celle!);
          
          risultati.push({ 
            richiesta_id: richiestaId, 
            stato: 'approved', 
            celle_aggiornate: richiesta.celle!.length 
          });
        } else {
          rejections.push(richiestaId);
          risultati.push({ 
            richiesta_id: richiestaId, 
            stato: 'rejected' 
          });
        }
      }

      // Esegui bulk operations
      
      // 1. Applica aggiornamenti griglia per modello
      for (const [modelId, { griglia, celle }] of modelGridUpdates) {
        for (const cella of celle) {
          griglia[cella.y][cella.x] = cella.nuovo_valore;
        }
        await modelloDao.updateGrid(modelId, griglia, transaction);
      }
      
      // 2. Bulk update status per approvazioni
      if (approvals.length > 0) {
        const approvalUpdates = approvals.map(r => ({ requestId: r.id, status: 'approved' as const }));
        await richiestaAggiornamentoDao.bulkUpdateStatus(approvalUpdates, transaction);
      }
      
      // 3. Bulk update status per rigetti
      if (rejections.length > 0) {
        const rejectionUpdates = rejections.map(id => ({ requestId: id, status: 'rejected' as const }));
        await richiestaAggiornamentoDao.bulkUpdateStatus(rejectionUpdates, transaction);
      }

      return {
        messaggio: 'Richieste elaborate con bulk operations',
        risultati,
        totale_elaborate: risultati.length,
        performance: {
          richieste_approvate: approvals.length,
          richieste_rigettate: rejections.length,
          modelli_aggiornati: modelGridUpdates.size
        }
      };
    });

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene l'elenco degli aggiornamenti di un modello con filtri opzionali e paginazione
 */
export const getModelUpdates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const modelId = req.modelId!; // Validato dal middleware validateModelId
    const { data_inizio, data_fine, stato } = req.query;
    const { limit: limiteNum, offset, page: paginaNum } = req.pagination!;

    // Costruisci filtri
    const filters: {
      stato?: 'pending' | 'approved' | 'rejected';
      dataInizio?: Date;
      dataFine?: Date;
    } = {};
    
    if (stato && ['pending', 'approved', 'rejected'].includes(stato as string)) {
      filters.stato = stato as 'pending' | 'approved' | 'rejected';
    }

    if (data_inizio) {
      filters.dataInizio = new Date(data_inizio as string);
    }
    if (data_fine) {
      filters.dataFine = new Date(data_fine as string);
    }

    const { rows: aggiornamenti, count } = await richiestaAggiornamentoDao.findByModelIdWithFiltersPaginated(
      modelId, 
      filters,
      limiteNum,
      offset
    );

    res.status(StatusCodes.OK).json({
      modello_id: modelId,
      aggiornamenti,
      totale: count,
      paginazione: {
        pagina_corrente: paginaNum,
        elementi_per_pagina: limiteNum,
        totale_elementi: count,
        totale_pagine: Math.ceil(count / limiteNum)
      },
      filtri_applicati: {
        data_inizio: data_inizio || null,
        data_fine: data_fine || null,
        stato: stato || 'tutti'
      }
    });

  } catch (error) {
    next(error);
  }
};