import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';

const sequelize = Database.getInstance();

/**
 * Attributi del modello Utente.
 */
export interface UtenteAttributes {
  id: number;
  email: string;
  password: string;
  ruolo: 'user' | 'admin';
  token_rimanenti: number;
}

class Utente extends Model<UtenteAttributes, Optional<UtenteAttributes, 'id'>> implements UtenteAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public ruolo!: 'user' | 'admin';
  public token_rimanenti!: number;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Utente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ruolo: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    token_rimanenti: {
      type: DataTypes.DECIMAL(10, 2), // Ripristinato DECIMAL per valori monetari
      allowNull: false,
      defaultValue: '20.00', // Stringa per DECIMAL
    },
  },
  {
    sequelize,
    tableName: 'Utente',
    timestamps: true, // Abilita createdAt e updatedAt
  }
);

export default Utente;
