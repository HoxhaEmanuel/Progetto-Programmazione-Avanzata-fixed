import { Transaction, Optional } from 'sequelize';
import { CellaAggiornamento } from '../models';
import { CellaAggiornamentoAttributes } from '../models/CellaAggiornamento';

/**
 * Data Access Object per la gestione delle celle di aggiornamento
 * Implementa il pattern DAO per separare la logica di accesso ai dati
 */
export class CellaAggiornamentoDao {
  
  

  

  /**
   * Crea multiple celle di aggiornamento in bulk
   */
  async bulkCreate(cellsData: Optional<CellaAggiornamentoAttributes, 'id'>[], transaction?: Transaction): Promise<CellaAggiornamento[]> {
    return await CellaAggiornamento.bulkCreate(cellsData, { transaction });
  }

  

  





  

  

  

  



  

  
}

export default new CellaAggiornamentoDao();