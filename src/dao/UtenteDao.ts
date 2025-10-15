import { Transaction, Op, Optional } from 'sequelize';
import { Utente } from '../models';
import { UtenteAttributes } from '../models/Utente';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

/**
 * Interfaccia per il risultato grezzo della query SUM
 */
interface TotalTokensResult {
  total_tokens: string | number | null;
}


/**
 * Data Access Object per la gestione degli utenti
 * Implementa il pattern DAO per separare la logica di accesso ai dati
 */
export class UtenteDao {
  
  /**
   * Trova un utente per ID
   */
  async findById(id: number, transaction?: Transaction): Promise<Utente | null> {
    return await Utente.findByPk(id, { transaction });
  }

  /**
   * Trova un utente per email
   */
  async findByEmail(email: string, transaction?: Transaction): Promise<Utente | null> {
    return await Utente.findOne({ 
      where: { email },
      transaction 
    });
  }

  /**
   * Crea un nuovo utente
   */
  async create(userData: Optional<UtenteAttributes, 'id'>, transaction?: Transaction): Promise<Utente> {
    return await Utente.create(userData, { transaction });
  }

  /**
   * Aggiorna i token rimanenti di un utente
   */
  async updateTokens(userId: number, newTokenAmount: number, transaction?: Transaction): Promise<[number]> {
    return await Utente.update(
      { token_rimanenti: newTokenAmount },
      { 
        where: { id: userId },
        transaction 
      }
    );
  }

  /**
   * Aggiorna un utente
   */
  // Metodo rimosso: update (non utilizzato)

  /**
   * Conta il numero totale di utenti
   */
  async count(): Promise<number> {
    return await Utente.count();
  }

  /**
   * Calcola il totale dei token nel sistema
   */
  async getTotalTokensInSystem(): Promise<number> {
    const result = await Utente.findAll({
      attributes: [
        [Utente.sequelize!.fn('SUM', Utente.sequelize!.col('token_rimanenti')), 'total_tokens']
      ],
      raw: true
    }) as unknown as TotalTokensResult[];

    const total = result[0]?.total_tokens;
    return total ? parseFloat(total.toString()) : 0;
  }

  /**
   * Ottiene tutti gli utenti con paginazione
   */
  async findAllWithPagination(limit: number, offset: number): Promise<{ count: number; rows: Utente[] }> {
    return await Utente.findAndCountAll({
      attributes: ['id', 'email', 'ruolo', 'token_rimanenti', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Verifica se un utente ha token sufficienti
   */
  // Metodo rimosso: hasEnoughTokens (non utilizzato)

  /**
   * Sottrae token da un utente
   */
  // Metodo rimosso: deductTokens (non utilizzato)

  /**
   * Sottrae token e ritorna il saldo aggiornato in una singola operazione
   * Elimina la necessità di chiamate multiple findById dopo deduzioni
   * @param userId - ID dell'utente
   * @param amount - Quantità di token da sottrarre
   * @param transaction - Transazione opzionale
   * @returns Saldo token aggiornato
   */
  async deductTokensAndGetBalance(userId: number, amount: number, transaction?: Transaction): Promise<number> {
    const user = await this.findById(userId, transaction);
    if (!user) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'Utente non trovato');
    }

    if (user.token_rimanenti < amount) {
      // Uniforma al tipo di errore standardizzato per token insufficienti (HTTP 401)
      throw ErrorFactory.createInsufficientTokensError(amount, user.token_rimanenti);
    }

    const newBalance = user.token_rimanenti - amount;
    
    await Utente.update(
      { token_rimanenti: newBalance },
      { 
        where: { id: userId },
        transaction 
      }
    );

    return newBalance;
  }

  /**
   * Aggiorna token e ritorna il saldo aggiornato
   * @param userId - ID dell'utente
   * @param newBalance - Nuovo saldo
   * @param transaction - Transazione opzionale
   * @returns Saldo token aggiornato
   */
  // Metodo rimosso: updateTokensAndGetBalance (non utilizzato)

  /**
   * Metodo rimosso: findMultipleByIds (non utilizzato)
   */
  // findMultipleByIds rimosso: nessun riferimento nel codice applicativo

  /**
   * Aggiorna token per multiple utenti (bulk operation)
   */
  // Metodo rimosso: bulkUpdateTokens (non utilizzato)

  /**
   * Verifica se multiple utenti hanno token sufficienti (bulk operation)
   */
  // Metodo rimosso: checkMultipleUsersTokens (non utilizzato)
}

export default new UtenteDao();