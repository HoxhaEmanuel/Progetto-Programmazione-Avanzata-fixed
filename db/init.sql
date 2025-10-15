-- CREAZIONE TABELLE DEL DATABASE CROWN-SOURCING --

-- Crea gli enum per i campi (allineato con Sequelize)
DO $$ BEGIN
    CREATE TYPE "public"."enum_Utente_ruolo" AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."enum_RichiestaAggiornamento_stato" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crea la tabella UTENTE
-- Nota: I nomi dei campi sono allineati con i modelli Sequelize e i controller.
CREATE TABLE IF NOT EXISTS "Utente" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    ruolo "public"."enum_Utente_ruolo" DEFAULT 'user' NOT NULL,
    token_rimanenti DECIMAL(10, 2) DEFAULT 20.00,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crea la tabella MODELLO
CREATE TABLE IF NOT EXISTS "Modello" (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    griglia JSONB NOT NULL,
    dimensioni_y INTEGER NOT NULL,
    dimensioni_x INTEGER NOT NULL,
    costo_creazione DECIMAL(10, 2) NOT NULL,
    creatore_id INTEGER NOT NULL REFERENCES "Utente"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabella RichiestaAggiornamento
CREATE TABLE IF NOT EXISTS "RichiestaAggiornamento" (
    id SERIAL PRIMARY KEY,
    modello_id INTEGER NOT NULL REFERENCES "Modello"(id) ON DELETE CASCADE,
    richiedente_id INTEGER NOT NULL REFERENCES "Utente"(id) ON DELETE CASCADE,
    stato "public"."enum_RichiestaAggiornamento_stato" DEFAULT 'pending' NOT NULL,
    costo_totale DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crea la tabella CELLA_AGGIORNAMENTO
CREATE TABLE IF NOT EXISTS "CellaAggiornamento" (
    id SERIAL PRIMARY KEY,
    richiesta_id INTEGER NOT NULL REFERENCES "RichiestaAggiornamento"(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    nuovo_valore INTEGER NOT NULL CHECK (nuovo_valore IN (0, 1)),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_modello_creatore ON "Modello"(creatore_id);
CREATE INDEX IF NOT EXISTS idx_richiesta_modello ON "RichiestaAggiornamento"(modello_id);
CREATE INDEX IF NOT EXISTS idx_richiesta_richiedente ON "RichiestaAggiornamento"(richiedente_id);
CREATE INDEX IF NOT EXISTS idx_richiesta_stato ON "RichiestaAggiornamento"(stato);
CREATE INDEX IF NOT EXISTS idx_cella_richiesta ON "CellaAggiornamento"(richiesta_id);