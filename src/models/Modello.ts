import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';

const sequelize = Database.getInstance();

export interface ModelloAttributes {
  id: number;
  nome: string;
  griglia: number[][];
  dimensioni_y: number;
  dimensioni_x: number;
  costo_creazione: number;
  creatore_id: number;
}

class Modello extends Model<ModelloAttributes, Optional<ModelloAttributes, 'id'>> implements ModelloAttributes {
  public id!: number;
  public nome!: string;
  public griglia!: number[][];
  public dimensioni_y!: number;
  public dimensioni_x!: number;
  public costo_creazione!: number;
  public creatore_id!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Modello.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    griglia: {
      type: DataTypes.JSONB, // Tipo di dato specifico di PostgreSQL, ottimo per le matrici
      allowNull: false,
    },
    dimensioni_y: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dimensioni_x: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    costo_creazione: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    creatore_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Utente',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'Modello',
    timestamps: true,
  }
);

export default Modello;
