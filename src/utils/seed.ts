import { initDb, Utente, Modello, RichiestaAggiornamento, CellaAggiornamento } from '../models';
import bcrypt from 'bcryptjs';

/**
 * Script per popolare il database con dati iniziali.
 */
const seedDatabase = async () => {
  try {
    // 1. Assicurati che le tabelle esistano prima di popolarle
    await initDb();

    // 2. Controlla se ci sono già utenti per evitare di ri-popolare
    const userCount = await Utente.count();
    if (userCount > 0) {
      console.log('[INFO] Il database sembra essere già popolato. Salto il seeding.');
      return;
    }

    console.log('[SEED] Popolamento del database in corso...');

    // 3. Crea gli utenti con password "hashate"
    const hashedPasswordAdmin = await bcrypt.hash('password_admin', 10);
    const hashedPasswordUser = await bcrypt.hash('password_user', 10);

    const admin = await Utente.create({
      email: 'admin@progetto.it',
      password: hashedPasswordAdmin,
      ruolo: 'admin',
      token_rimanenti: 1000.00,
    });

    const user1 = await Utente.create({
      email: 'utente@progetto.it',
      password: hashedPasswordUser,
      ruolo: 'user',
      token_rimanenti: 50.00,
    });

    const user2 = await Utente.create({
      email: 'utente2@progetto.it',
      password: hashedPasswordUser,
      ruolo: 'user',
      token_rimanenti: 75.00,
    });

    console.log(`-> Creato utente admin: ${admin.email}`);
    console.log(`-> Creato utente user1: ${user1.email}`);
    console.log(`-> Creato utente user2: ${user2.email}`);

    // 4. Crea almeno 3 modelli diversi con 2 versioni ciascuno
    
    // Modello 1: Labirinto Semplice (Versione 1)
    const modello1v1 = await Modello.create({
      nome: 'Labirinto Semplice v1',
      griglia: [
        [0, 0, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
      ],
      dimensioni_y: 5,
      dimensioni_x: 5,
      costo_creazione: 1.25,
      creatore_id: user1.id,
    });

    // Modello 1: Labirinto Semplice (Versione 2 - con più ostacoli)
    const modello1v2 = await Modello.create({
      nome: 'Labirinto Semplice v2',
      griglia: [
        [0, 1, 0, 1, 0],
        [1, 1, 0, 1, 0],
        [0, 0, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
      ],
      dimensioni_y: 5,
      dimensioni_x: 5,
      costo_creazione: 1.25,
      creatore_id: user1.id,
    });

    // Modello 2: Griglia Urbana (Versione 1)
    const modello2v1 = await Modello.create({
      nome: 'Mappa Urbana v1',
      griglia: [
        [0, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1],
        [1, 1, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0]
      ],
      dimensioni_y: 5,
      dimensioni_x: 6,
      costo_creazione: 1.50,
      creatore_id: user2.id,
    });

    // Modello 2: Griglia Urbana (Versione 2 - strade alternative)
    const modello2v2 = await Modello.create({
      nome: 'Mappa Urbana v2',
      griglia: [
        [0, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1],
        [1, 1, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0]
      ],
      dimensioni_y: 5,
      dimensioni_x: 6,
      costo_creazione: 1.50,
      creatore_id: user2.id,
    });

    // Modello 3: Campo Aperto (Versione 1)
    const modello3v1 = await Modello.create({
      nome: 'Campo Aperto v1',
      griglia: [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
      ],
      dimensioni_y: 4,
      dimensioni_x: 4,
      costo_creazione: 0.80,
      creatore_id: admin.id,
    });

    // Modello 3: Campo Aperto (Versione 2 - con ostacoli sparsi)
    const modello3v2 = await Modello.create({
      nome: 'Campo Aperto v2',
      griglia: [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0]
      ],
      dimensioni_y: 4,
      dimensioni_x: 4,
      costo_creazione: 0.80,
      creatore_id: admin.id,
    });

    console.log('-> Creati 6 modelli (3 tipi x 2 versioni).');

    // 5. Crea alcune richieste di aggiornamento di esempio
    const richiesta1 = await RichiestaAggiornamento.create({
      stato: 'pending',
      modello_id: modello1v1.id,
      richiedente_id: user2.id,
      costo_totale: 0.02
    });

    await CellaAggiornamento.create({
      x: 0,
      y: 0,
      nuovo_valore: 1,
      richiesta_id: richiesta1.id
    });

    const richiesta2 = await RichiestaAggiornamento.create({
      stato: 'approved',
      modello_id: modello2v1.id,
      richiedente_id: user1.id,

      costo_totale: 0.04
    });

    await CellaAggiornamento.create({
      x: 2,
      y: 2,
      nuovo_valore: 1,
      richiesta_id: richiesta2.id
    });

    const richiesta3 = await RichiestaAggiornamento.create({
      stato: 'rejected',
      modello_id: modello3v1.id,
      richiedente_id: user1.id,

      costo_totale: 0.02
    });

    await CellaAggiornamento.create({
      x: 1,
      y: 1,
      nuovo_valore: 0,
      richiesta_id: richiesta3.id
    });

    console.log('-> Create 3 richieste di aggiornamento di esempio.');
    console.log('[SUCCESS] Seeding del database completato con successo!');
  } catch (error) {
    console.error('[ERROR] Errore durante il seeding del database:', error);
  } finally {
    // Chiudi la connessione al database solo se eseguito direttamente
    if (require.main === module) {
      process.exit();
    }
  }
};

// Esporta la funzione per l'uso nei test
export { seedDatabase };

// Esegui la funzione di seed solo se il file è eseguito direttamente
if (require.main === module) {
  seedDatabase();
}

