# Collection Postman - Crown-Sourcing API Tests

Questa directory contiene la collection Postman completa per testare tutte le API del progetto Crown-Sourcing.

## File Incluso

- **`Crown-Sourcing_API_Tests.postman_collection.json`**: Collection completa con tutte le richieste API e variabili integrate

## Come Importare in Postman

### 1. Importa la Collection
1. Apri Postman
2. Clicca su **"Import"** in alto a sinistra
3. Seleziona il file `Crown-Sourcing_API_Tests.postman_collection.json`
4. Clicca **"Import"**

### 2. Configurazione Automatica
La collection include già tutte le variabili necessarie:
- `baseUrl`: http://localhost:3000
- `userToken`: Token utente (auto-popolato dopo login)
- `adminToken`: Token admin (auto-popolato dopo login admin)
- `modelId`: ID modello (auto-popolato dopo creazione)
- `modelId2`: ID secondo modello per test collaborativi
- `requestId`: ID richiesta aggiornamento
- `user2Token`: Token secondo utente per test collaborativi

## Configurazione Iniziale

### 1. Avvia il Server
Prima di testare, assicurati che il server sia in esecuzione:
```bash
npm run dev
```
Il server dovrebbe essere disponibile su `http://localhost:3000`

### 2. Verifica l'URL Base
Se necessario, modifica la variabile `baseUrl` nella collection:
- **Sviluppo locale**: `http://localhost:3000` (default)
- **Produzione**: Modifica con l'URL del tuo server

## Ordine di Esecuzione Consigliato

### 1. **AUTENTICAZIONE**
1. **1.1 Registrazione Utente** - Registra un nuovo utente
2. **1.2 Login Utente** - Effettua il login (salva automaticamente il token)
3. **1.3 Registrazione Admin** - Registra admin (solo se DEMO_ALLOW_ADMIN_SELF_REGISTER=true)
4. **1.4 Login Admin** - Login come amministratore
5. **1.5 Registrazione Secondo Utente** - Per test collaborativi
6. **1.6 Login Secondo Utente** - Login secondo utente

### 2. **GESTIONE MODELLI**
1. **2.1 Creazione Modello** - Crea un nuovo modello (salva automaticamente l'ID)
2. **2.2 Lista Modelli Utente** - Visualizza i modelli dell'utente
3. **2.3 Dettagli Modello** - Ottieni dettagli di un modello specifico
4. **2.4 Esecuzione A*** - Esegui pathfinding sul modello

### 3. **SISTEMA COLLABORATIVO**
1. **3.1 Creazione Secondo Modello** - Crea modello per test collaborativi
2. **3.2 Richiesta Aggiornamento** - Richiedi aggiornamento da altro utente
3. **3.3 Lista Richieste Ricevute** - Visualizza richieste ricevute
4. **3.4 Approvazione Aggiornamento** - Approva una richiesta
5. **3.5 Rifiuto Aggiornamento** - Rifiuta una richiesta
6. **3.6 Aggiornamento Bulk** - Approva multiple celle contemporaneamente

### 4. **AMMINISTRAZIONE**
1. **4.1 Lista Tutti Utenti** - Visualizza tutti gli utenti (solo admin)
2. **4.2 Ricarica Token Utente** - Ricarica token di un utente (solo admin)
3. **4.3 Lista Tutti Modelli** - Visualizza tutti i modelli (solo admin)

### 5. **GESTIONE TOKEN**
1. **5.1 Saldo Token Corrente** - Visualizza il saldo token dell'utente
2. **5.2 Storico Token** - Visualizza lo storico delle transazioni token

## Funzionalità Avanzate

### Auto-popolamento Variabili
La collection è configurata per auto-popolare automaticamente le variabili durante l'esecuzione:
- I token vengono salvati automaticamente dopo il login
- Gli ID dei modelli vengono salvati dopo la creazione
- Gli ID delle richieste vengono salvati per i test successivi

### Test Automatici
Ogni richiesta include test automatici che verificano:
- Status code corretto
- Presenza dei campi richiesti nella risposta
- Validazione dei dati ricevuti
- Salvataggio automatico delle variabili per test successivi

### Gestione Errori
La collection include test per scenari di errore comuni:
- Token mancanti o non validi
- Permessi insufficienti
- Token insufficienti
- Dati non validi

## Note Importanti

1. **Ordine di Esecuzione**: Segui l'ordine numerato per garantire che le variabili siano popolate correttamente
2. **Token Economy**: Ogni operazione consuma token secondo le tariffe definite nel sistema
3. **Ruoli**: Alcuni endpoint richiedono privilegi di amministratore
4. **Ambiente Demo**: Se `DEMO_ALLOW_ADMIN_SELF_REGISTER=true`, puoi registrare admin direttamente

## Troubleshooting

- **Server non raggiungibile**: Verifica che il server sia avviato su localhost:3000
- **Token non valido**: Effettua nuovamente il login per ottenere un token fresco
- **Permessi negati**: Verifica di essere loggato con il ruolo corretto (user/admin)
- **Token insufficienti**: Usa l'endpoint admin per ricaricare i token