import { Transaction, Optional } from 'sequelize';
import { Modello } from '../models';
import { ModelloAttributes } from '../models/Modello';

/**
 * Data Access Object per la gestione dei modelli
 * Implementa il pattern DAO per separare la logica di accesso ai dati
 */
export class ModelloDao {
  
  /**
   * Trova un modello per ID
   */
  async findById(id: number, transaction?: Transaction): Promise<Modello | null> {
    return await Modello.findByPk(id, { transaction });
  }

  /**
   * Crea un nuovo modello
   */
  async create(modelData: Optional<ModelloAttributes, 'id'>, transaction?: Transaction): Promise<Modello> {
    return await Modello.create(modelData, { transaction });
  }

  /**
   * Aggiorna un modello
   */
  async update(modelId: number, updateData: Partial<ModelloAttributes>, transaction?: Transaction): Promise<[number]> {
    return await Modello.update(
      updateData,
      { 
        where: { id: modelId },
        transaction 
      }
    );
  }

  /**
   * Aggiorna la griglia di un modello
   */
  async updateGrid(modelId: number, newGrid: number[][], transaction?: Transaction): Promise<[number]> {
    return await this.update(modelId, { griglia: newGrid }, transaction);
  }

  /**
   * Trova tutti i modelli di un utente
   */
  // Metodo rimosso: findByCreatorId (non utilizzato)

  /**
   * Trova tutti i modelli di un utente con paginazione
   */
  async findByCreatorIdPaginated(
    creatorId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ rows: Modello[]; count: number }> {
    return await Modello.findAndCountAll({
      where: { creatore_id: creatorId },
      attributes: ['id', 'nome', 'dimensioni_y', 'dimensioni_x', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Trova tutti i modelli con paginazione (per admin)
   */
  // Metodo rimosso: findAllPaginated (non utilizzato)

  /**
   * Conta il numero totale di modelli
   */
  async count(): Promise<number> {
    return await Modello.count();
  }

  /**
   * Ottiene informazioni complete del modello (ottimizzato per evitare query multiple)
   */
  // Metodo rimosso: getModelInfo (non utilizzato)

  /**
   * Ottiene lo stato di un modello, incluso il conteggio delle richieste pending
   * @param modelId - ID del modello
   * @returns Oggetto con dati modello e conteggio richieste pending, o null se non trovato
   */
  async getModelStatusInfo(modelId: number): Promise<{ modello: Modello; pendingRequests: number } | null> {
    const modello = await Modello.findByPk(modelId);
    if (!modello) return null;

    // Usa una query separata per il conteggio per evitare problemi di sintassi SQL
    const { RichiestaAggiornamento } = require('../models');
    const pendingCount = await RichiestaAggiornamento.count({
      where: {
        modello_id: modelId,
        stato: 'pending'
      }
    });

    return {
      modello,
      pendingRequests: pendingCount
    };
  }

  /**
   * Verifica se un utente è il creatore di un modello
   */
  async isCreator(modelId: number, userId: number, transaction?: Transaction): Promise<boolean> {
    const model = await this.findById(modelId, transaction);
    return model ? model.creatore_id === userId : false;
  }

  /**
   * Trova più modelli per ID (bulk operation per evitare N+1)
   */
  async findMultipleByIds(modelIds: number[], transaction?: Transaction): Promise<Modello[]> {
    return await Modello.findAll({
      where: {
        id: modelIds
      },
      attributes: ['id', 'creatore_id'],
      transaction
    });
  }

  /**
   * Verifica la proprietà di più modelli in bulk (ottimizzato per evitare N+1)
   */
  async checkMultipleOwnership(modelIds: number[], userId: number, transaction?: Transaction): Promise<Map<number, boolean>> {
    const models = await this.findMultipleByIds(modelIds, transaction);
    const ownershipMap = new Map<number, boolean>();
    
    // Inizializza tutti i modelli come non posseduti
    modelIds.forEach(id => ownershipMap.set(id, false));
    
    // Aggiorna la mappa con i modelli effettivamente posseduti
    models.forEach(model => {
      ownershipMap.set(model.id, model.creatore_id === userId);
    });
    
    return ownershipMap;
  }

  /**
   * Metodo rimosso: getDimensions (non utilizzato all'esterno)
   */
  // getDimensions rimosso: le validazioni coordinate sono gestite da coordinateValidator

  /**
   * Ottiene la griglia di un modello
   */
  async getGrid(modelId: number, transaction?: Transaction): Promise<number[][] | null> {
    const model = await this.findById(modelId, transaction);
    return model ? model.griglia : null;
  }

  /**
   * Metodo rimosso: areCoordinatesValid (sostituito da utils/coordinateValidator)
   */
  // areCoordinatesValid rimosso: usare validateCoordinates/isValidCoordinate in coordinateValidator

  /**
   * Ottiene il valore di una cella specifica
   */
  // Metodo rimosso: getCellValue (non utilizzato)


}

export default new ModelloDao();