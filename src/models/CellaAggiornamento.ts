import { Model, DataTypes, Optional } from 'sequelize';
import Database from '../utils/database';

const sequelize = Database.getInstance();

export interface CellaAggiornamentoAttributes {
  id: number;
  x: number;
  y: number;
  nuovo_valore: 0 | 1;
  richiesta_id: number;
}

class CellaAggiornamento extends Model<CellaAggiornamentoAttributes, Optional<CellaAggiornamentoAttributes, 'id'>> implements CellaAggiornamentoAttributes {
  public id!: number;
  public x!: number;
  public y!: number;
  public nuovo_valore!: 0 | 1;
  public richiesta_id!: number;
}

CellaAggiornamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    x: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    y: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nuovo_valore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    richiesta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'RichiestaAggiornamento', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'CellaAggiornamento',
    timestamps: false, // Questi record sono immutabili, non servono timestamps
  }
);

export default CellaAggiornamento;
