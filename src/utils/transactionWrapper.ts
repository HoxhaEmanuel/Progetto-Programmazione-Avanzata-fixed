import { Transaction } from 'sequelize';
import Database from './database';

/**
 * Opzioni per il wrapper delle transazioni
 */
interface TransactionOptions {
    /** Handler personalizzato per errori */
    errorHandler?: (error: unknown) => void;
    /** Timeout per la transazione in millisecondi */
    timeout?: number;
    /** Livello di isolamento della transazione */
    isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

/**
 * Wrapper unificato per gestione automatica delle transazioni
 * Elimina la duplicazione tra withTransaction e withTransactionAndErrorHandler
 * @param callback - Funzione da eseguire all'interno della transazione
 * @param options - Opzioni per la transazione
 * @returns Promise con il risultato del callback
 */
export const withTransaction = async <T>(
    callback: (transaction: Transaction) => Promise<T>,
    options?: TransactionOptions
): Promise<T> => {
    const sequelize = Database.getInstance();
    
    // Configurazione transazione
    const transactionConfig: {
        timeout?: number;
        isolationLevel?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    } = {};
    if (options?.timeout) {
        transactionConfig.timeout = options.timeout;
    }
    if (options?.isolationLevel) {
        // Mappa i valori stringa ai valori SQL corretti
        const isolationMap = {
            'READ_UNCOMMITTED': 'READ UNCOMMITTED',
            'READ_COMMITTED': 'READ COMMITTED', 
            'REPEATABLE_READ': 'REPEATABLE READ',
            'SERIALIZABLE': 'SERIALIZABLE'
        };
        transactionConfig.isolationLevel = isolationMap[options.isolationLevel];
    }
    
    const transaction = await sequelize.transaction(transactionConfig) as Transaction;

    try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        
        // Gestione errore personalizzata
        if (options?.errorHandler) {
            try {
                options.errorHandler(error);
            } catch (handlerError) {
                // Se l'error handler fallisce, logga ma non bloccare
                console.error('Error handler failed:', handlerError);
            }
        }
        
        throw error;
    }
};