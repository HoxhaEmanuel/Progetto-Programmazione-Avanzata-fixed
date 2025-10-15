import { Model, DataTypes, Optional } from 'sequelize';
import Database from '../utils/database';
import Modello from './Modello';
import CellaAggiornamento from './CellaAggiornamento';

const sequelize = Database.getInstance();

export interface RichiestaAggiornamentoAttributes {
  id: number;
  stato: 'pending' | 'approved' | 'rejected';
  costo_totale: number;
  modello_id: number;
  richiedente_id: number;
}

/**
 * Interfaccia per i filtri di ricerca degli aggiornamenti
 */
export interface UpdateFilters {
  stato?: 'pending' | 'approved' | 'rejected';
  dataInizio?: Date;
  dataFine?: Date;
}

class RichiestaAggiornamento extends Model<RichiestaAggiornamentoAttributes, Optional<RichiestaAggiornamentoAttributes, 'id'>> implements RichiestaAggiornamentoAttributes {
  public id!: number;
  public stato!: 'pending' | 'approved' | 'rejected';
  public costo_totale!: number;
  public modello_id!: number;
  public richiedente_id!: number;

  // Association properties
  public modello?: Modello;
  public celle?: CellaAggiornamento[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RichiestaAggiornamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stato: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    costo_totale: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    modello_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Modello', key: 'id' },
    },
    richiedente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Utente', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'RichiestaAggiornamento',
    timestamps: true, // createdAt sarà la data della richiesta
  }
);

export default RichiestaAggiornamento;
