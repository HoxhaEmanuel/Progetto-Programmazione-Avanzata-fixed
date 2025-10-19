# Registro Fix per Conformità alle Specifiche

Questo file traccia in modo sintetico i fix applicati per allineare il progetto alle specifiche e migliorare la coerenza interna.

## 1) Gestione errore "Token insufficienti"

- errore
  - Codice HTTP incoerente per "token insufficienti" nel flusso di aggiornamento celle: `UtenteDao.deductTokensAndGetBalance` lanciava un errore di tipo `BadRequest` (400), mentre le specifiche e l'infrastruttura di error handling prevedono un tipo specifico `InsufficientTokens` mappato a 401. Anche il middleware `requireTokens` già usa 401.

- motivazione
  - Uniformare i codici di stato e i tipi di errore garantisce coerenza tra middleware, DAO e controller. Le specifiche richiedono una gestione chiara e consistente dei casi di saldo insufficiente; adottare `InsufficientTokens` evita ambiguità e disallineamenti tra le rotte.

- fix applicato
  - Sostituito il lancio dell'errore in `src/dao/UtenteDao.ts#deductTokensAndGetBalance` da `ErrorTypes.BadRequest` a `ErrorFactory.createInsufficientTokensError(required, available)`, che produce `ErrorTypes.InsufficientTokens` con status 401 e messaggio standardizzato:
    - Prima: `ErrorFactory.createError(ErrorTypes.BadRequest, ...)` → HTTP 400
    - Dopo: `ErrorFactory.createInsufficientTokensError(amount, user.token_rimanenti)` → HTTP 401
  - Impatto atteso: tutte le rotte che passano da questo DAO per la deduzione dei token ora restituiscono 401 in caso di saldo insufficiente, allineandosi al middleware e alle specifiche. Eventuali test o documentazione che si aspettavano 400 andranno aggiornati in un passaggio successivo.

### Aggiornamenti correlati

- Test aggiornati
  - File: `tests/updates.test.js`
  - Modifica: il test "should not create update with insufficient tokens" ora si aspetta `401` invece di `400`.

- Documentazione aggiornata
  - File: `README.md`
  - Modifiche:
    - Tabella codici di stato: la riga `401 Unauthorized` ora include anche "token insufficienti"; la riga `422 Unprocessable Entity` è marcata come "Non usato" per evitare ambiguità.
    - Nome database: corretti tutti i riferimenti da `crownsourcing_db` a `crowdsourcing_db` (sezione env e snippet SQL).


  
## 2) Nome database di test allineato (crownsourcing → crowdsourcing)

- Problema: In ambiente `test` la connessione puntava a `test_progetto_crownsourcing` (senza "d"), ma gli script di setup creano/usano `test_progetto_crowdsourcing` (con "d"). Risultato: `SequelizeConnectionError: database "test_progetto_crownsourcing" does not exist`.
- Motivazione: Evitare errori di connessione e rendere coerenti app e script di test.
- Fix applicato: In `src/utils/database.ts` ora, con `NODE_ENV === 'test'`, il nome DB è `process.env.DB_NAME || 'test_progetto_crowdsourcing'` (default coerente con gli script). Inoltre, aggiornato `.env.test` impostando `DB_NAME=test_progetto_crowdsourcing`. In altri ambienti resta `process.env.DB_NAME || 'crownsourcing_db'`.
- Impatto: I test si connettono al DB creato da `tests/createTestDb.js` e inizializzato da `tests/initTestSchema.js`. È possibile sovrascrivere con `DB_NAME` se necessario.

## 3) Allineamento naming Docker (container e network)

- Problema: In `docker-compose.yml` erano presenti nomi cosmetici con "crownsourcing" (senza "d").
- Motivazione: Coerenza complessiva del progetto e minor confusione durante l'uso di Docker.
- Fix applicato: Rinominati `container_name` e `network` in `docker-compose.yml`:
  - `crownsourcing_postgres_db` → `crowdsourcing_postgres_db`
  - `crownsourcing_backend` → `crowdsourcing_backend`
  - `crownsourcing_network` → `crowdsourcing_network`
- Impatto: Nessun impatto funzionale. Dopo la modifica, è consigliato eseguire `docker-compose down` per rimuovere la vecchia rete e poi `docker-compose up -d`.

### Aggiornamenti correlati

- Esempio env
  - File: `.env.example`
  - Modifica: `DB_NAME=crowdsourcing_db` per allineamento con codice e README.

## 4) Unificazione calcolo costi token (centralizzazione e modello lineare)

- problema
  - Calcolo dei costi duplicato e potenzialmente divergente: helper nel middleware con logica lineare, utility in `tokenUtils` con logica più ricca (maggiorazioni/sconti), controller aggiornamenti con calcolo diretto (`celle * 0.35`).

- motivazione
  - Allinearsi alle specifiche e ai test esistenti (modello lineare: creazione `0.05`/cella; aggiornamento `0.35`/cella; creatore gratis) ed evitare codice morto/incoerente.

- fix applicato
  - `src/utils/tokenUtils.ts`: semplificati e resi canonici i calcoli — `calculateModelCreationCost` e `calculateUpdateCost` ora applicano formule lineari; `calculateExecutionCost` resta uguale al costo di creazione.
  - `src/middleware/authMiddleware.ts`: rimosso il calcolo duplicato e delega a `tokenUtils.calculateModelCreationCost` per il pre‑check (creazione/esecuzione). Nota in-file che il costo aggiornamenti è calcolato nel controller via `tokenUtils`.
  - `src/controllers/updateController.ts`: usa `tokenUtils.calculateUpdateCost` per calcolare il costo reale delle celle da aggiornare, mantenendo gratuità per il creatore.

- impatto
  - Nessun cambiamento funzionale: i test (51/51) passano invariati. Ridotta duplicazione e aumentata coerenza. Documentazione aggiornata per riflettere il modello lineare e l’unica fonte di verità (`tokenUtils`).

- documentazione aggiornata
  - `SPIEGAZIONE_CODICE.md`: sezioni “Calcolo Costi e Deduzione Token” e flusso aggiornamenti aggiornati per indicare l’uso di `tokenUtils` e le formule lineari.
  - `AUDIT_FIXLIST.md`: marcata come RISOLTA la criticità “Duplicazione e incoerenze nei costi dei token”; aggiornata lista attività.

## 5) README: esplicitazione costo aggiornamenti (modello lineare)

- problema
  - La sezione descrittiva di `RICHIESTA_AGGIORNAMENTO` indicava genericamente “Costo: Calcolato in base al numero di celle da modificare” senza riportare l’importo unitario previsto dalle specifiche e dai test.

- motivazione
  - Migliorare chiarezza e coerenza con specifiche e comportamento: costo aggiornamenti `0.35` per cella effettivamente modificata; aggiornamenti gratuiti per il creatore del modello.

- fix applicato
  - File: `README.md`
  - Modifica: aggiornato bullet “Costo” nella sezione `RICHIESTA_AGGIORNAMENTO` in “0.35 × numero_celle effettivamente modificate (creatore gratis)”.

- impatto
  - Documentazione allineata al modello costi lineare centralizzato (`src/utils/tokenUtils.ts`) e ai test di integrazione.
## 6) Gestione Ruoli: ENUM + Flag Demo per auto-registrazione admin

Problema
- Il sistema consentiva la self-assegnazione del ruolo `admin` durante la registrazione, delegando al client la definizione del privilegio. Il controllo `requireAdmin` si basava sul ruolo nel JWT, quindi un token con ruolo auto-assegnato poteva accedere a rotte admin.
- A livello ORM il campo `ruolo` era definito come `STRING(50)`, meno rigoroso rispetto a un `ENUM`. La validazione forte era presente solo nel `CHECK` SQL della tabella.

Motivazione
- Ridurre il rischio di escalation di privilegi e allineare il modello ai principi discussi a lezione (uso di `ENUM` per ruoli).
- Mantenere una deroga controllata per scopi dimostrativi durante l’esame.

Soluzione
- Modello Sequelize: `ruolo` tipizzato come `DataTypes.ENUM('user','admin')`, con default `user` e `allowNull: false`.
- Controller di registrazione: ignora il `ruolo` proveniente dal client e forza `user`, eccetto quando la variabile d’ambiente `DEMO_ALLOW_ADMIN_SELF_REGISTER=true` è attiva; in tal caso, se il client invia `ruolo=admin`, l’utente viene creato come admin.
- Documentazione: aggiornato `README.md` con la politica ruoli e la variabile d’ambiente demo.

Impatto
- Sicurezza migliorata: il ruolo è vincolato in ORM e DB; la registrazione non consente privilegi non autorizzati quando la deroga è disattivata.
- Compatibilità test: utenti admin creati via seed o test continuano ad accedere alle rotte admin; il JWT mantiene il ruolo corretto.
- Ambiente demo: consente facilmente la prova delle funzionalità admin durante la presentazione, con un flag esplicito e documentato.

## 7) Creazione Modello Atomica (Transazione): evitare "modelli gratuiti"

- errore
  - Il flusso `createModel` creava il modello prima e sottraeva i token dopo, senza transazione. In caso di fallimento della deduzione (saldo cambiato, concorrenza, errori DB), il modello rimaneva creato, violando la specifica “Il modello può essere creato se c’è credito sufficiente”.
  - Stato precedente del codice: in `src/controllers/modelController.ts#createModel`:
    - `modelloDao.create({...})` eseguito subito.
    - `utenteDao.deductTokensAndGetBalance(userId, costoCreazione)` chiamato dopo (senza `transaction`).

- motivazione
  - Garantire integrità atomica tra addebito e creazione: o entrambe le operazioni riescono, o nessuna. Allineare il comportamento alle specifiche e prevenire inconsistenze.

- fix applicato (Opzione A)
  - Wrapping di `createModel` in `withTransaction(...)`.
  - Ordine delle operazioni in transazione:
    1) `utenteDao.deductTokensAndGetBalance(userId, costoCreazione, transaction)` — deduce e valida saldo.
    2) `modelloDao.create({...}, transaction)` — crea il modello.
  - Risposta `201 Created` generata all’interno del callback transazionale.

- impatto
  - Rimosso il rischio di “modelli gratuiti” e conformità alle specifiche ripristinata.
  - Nessuna modifica ai payload o ai test attesi; comportamento per l’utente invariato.
  - Migliore robustezza sotto concorrenza; rollback automatico se un passo fallisce.

## 8) Rotta `PUT /api/updates/approve-reject`: codice HTTP per richieste non autorizzate

Problema
- La rotta restituisce sempre `200 OK` anche quando nel payload di risposta (`result.risultati`) sono presenti elementi non autorizzati (es. `errore: 'Non autorizzato per questo modello'`). Questo obbliga i client a ispezionare il body per riconoscere la non autorizzazione, risultando incoerente con altre rotte che usano `403 Forbidden`.

Motivazione
- Allineare la semantica REST: gli errori di autorizzazione dovrebbero riflettersi nello status HTTP.
- Migliorare la prevedibilità lato client e la coerenza con il resto dell’API (es. rotte admin che rispondono `403`).

Soluzioni Proposte

Opzione A — Fix minimo (1 riga)
- Descrizione: mantenere l’elaborazione parziale, ma impostare `403` se nel batch è presente almeno un item non autorizzato.
- Implementazione: in `src/controllers/updateController.ts`, sostituire la riga finale
  - Da: `res.status(StatusCodes.OK).json(result);`
  - A: `res.status(result.risultati?.some(r => typeof r.errore === 'string' && r.errore.includes('Non autorizzato')) ? StatusCodes.FORBIDDEN : StatusCodes.OK).json(result);`
- Pro:
  - Patch ultraleggera, nessun refactor delle bulk operations.
  - Codice HTTP coerente con la presenza di errori di autorizzazione.
- Contro:
  - Fragile: si affida a una stringa (`'Non autorizzato'`), meglio un flag/`http_status` per item.
  - Ambiguità: lo status `403` segnala failure complessivo anche se alcune approvazioni sono state applicate (elaborazione parziale).

Opzione B — `403` “all-or-nothing” con pre-check globale
- Descrizione: se qualunque modello nel batch non è posseduto, rifiutare l’intero batch con `403` e non eseguire alcuna operazione.
- Implementazione: dopo la costruzione di `ownershipMap` (da `modelloDao.checkMultipleOwnership`), effettuare un pre‑controllo:
  - Se esiste almeno un `modello_id` non posseduto → `return next(ErrorFactory.createError(ErrorTypes.Forbidden, 'Non autorizzato: richieste contengono modelli non tuoi'));`
  - Evitare applicazioni parziali di griglia/stati.
- Pro:
  - Semantica chiara e coerente (o tutto passa, o tutto fallisce).
  - Semplifica i client e i test.
- Contro:
  - Non consente esiti misti; più restrittivo.

Opzione C — `207 Multi-Status` per esiti misti
- Descrizione: mantenere elaborazione parziale, ma usare `207` e un payload strutturato per item.
- Implementazione:
  - Rispondere con `res.status(207)` quando il batch ha esiti misti.
  - Definire per ciascun item: `id`, `azione`, `esito`, `http_status` (es. `200`, `403`, `404`), `errore` (se presente).
  - Documentare la policy: nessun rollback globale; gli item autorizzati vengono applicati.
- Pro:
  - Semantica REST corretta per operazioni bulk con esiti misti.
  - I client possono gestire ogni item in modo puntuale.
- Contro:
  - Maggior complessità lato client e test.
  - Richiede uno schema payload più esplicito.

Impatto sui Test
- Opzione A: aggiornare il test “utente diverso” in `tests/updates.test.js` per aspettarsi `403`.
- Opzione B: oltre al cambio a `403`, verificare che nessuna approvazione/rigetto venga applicata.
- Opzione C: aggiornare l’atteso a `207` e validare la struttura per item (`http_status`, `errore`, ecc.).

Decisione Attuale
- Nessuna modifica applicata al codice di produzione; questa sezione documenta il problema e le opzioni di risoluzione.
- Raccomandazione: adottare l’Opzione B per coerenza e semplicità, oppure l’Opzione C come soluzione ideale quando si desiderano esiti misti formalizzati. L’Opzione A è un fix rapido ma fragile; se scelta, preferire l’introduzione di un flag strutturato/`http_status` per item al posto della ricerca testuale.

## 9) Formato coordinate: supporto `{goal: {x, y}}` in normalizeCoordinates

- stato precedente
  - L’utility `normalizeCoordinates` supportava `{startX, startY, goalX, goalY}` e `{start: {x, y}, end: {x, y}}`, ma non `{goal: {x, y}}`. Il controller `executeModel` menzionava solo `{start: {x, y}, end: {x, y}}` nel messaggio d’errore.

- motivazione errore
  - Incoerenza semantica: nel progetto si usa il termine "goal" per le coordinate di destinazione (`goalX/goalY`), mentre la forma oggetto alternativa accettava solo `end`. Questo poteva confondere e portare a richieste respinte quando i client inviavano `{goal: {x, y}}`.

- patch applicata
  - `src/utils/coordinateValidator.ts#normalizeCoordinates`: aggiunto supporto al formato `{goal: {x, y}}` oltre a `end` e alle chiavi separate.
  - `src/controllers/modelController.ts#executeModel`: aggiornato il messaggio di errore per elencare chiaramente tutti i formati supportati (`{startX, startY, goalX, goalY}` oppure `{start:{x,y}, goal:{x,y}}` o `{start:{x,y}, end:{x,y}}`).

## 10) Rimozione metodi inutilizzati in DAO e util

- motivo
  - Ridurre codice morto e ambiguità. Diverse funzioni non sono referenziate dal codice applicativo né dai test; alcune sono state superate da metodi più specifici o da funzioni aggregate (es. `getStats()` rende superflue `countByStatus` e `count`).

- file e metodi rimossi
  - `src/dao/UtenteDao.ts`:
    - `update`
    - `hasEnoughTokens`
    - `deductTokens`
    - `updateTokensAndGetBalance`
    - `bulkUpdateTokens`
    - `checkMultipleUsersTokens`
  - `src/dao/RichiestaAggiornamentoDao.ts`:
    - `findByIdWithRelations`
    - `updateStatus`
    - `countPendingByModelId`
    - `countByStatus`
    - `count`
    - `isPending`
  - `src/dao/ModelloDao.ts`:
    - `findByCreatorId`
    - `findAllPaginated`
    - `getModelInfo`
    - `getCellValue`
  - `src/utils/jwt.ts`:
    - `verifyToken` (il middleware di autenticazione usa `jsonwebtoken` direttamente)

- validazione
  - Compilazione `npm run build`: OK.
  - Test `npm test`: 51/51 passed.

- note
  - Metodi affini e ancora utili restano disponibili (`deductTokensAndGetBalance`, `getGrid`, `getModelStatusInfo`, ecc.). Se in futuro servissero API paginated/admin per modelli o conteggi granulari, si potranno reintrodurre con copertura test dedicata.

- impatto
  - Retrocompatibile: nessuna rotta o test esistente cambia. Client che inviano `{goal:{x,y}}` ora sono accettati. Migliorata la coerenza terminologica dell’API.

## 10) Tipi numerici dei token: cast esplicito a `number` in authenticateToken

- stato precedente
  - `req.user.token_rimanenti` veniva valorizzato direttamente con `user.token_rimanenti` (campo ORM `DECIMAL(10,2)`), che a runtime può essere una stringa (es. `'20.00'`). L’interfaccia `AuthenticatedRequest` dichiara invece `token_rimanenti: number`.

- motivazione errore
  - Ambiguità di tipo: pur funzionando grazie alla coercizione di JavaScript, l’uso di stringhe numeriche può generare comportamenti inattesi in operazioni non aritmetiche (es. concatenazioni, serializzazioni). Allineare il runtime al tipo dichiarato riduce fragilità e incoerenze.

- patch applicata
  - `src/middleware/authMiddleware.ts#authenticateToken`: applicato `Number(user.token_rimanenti)` quando si popola `req.user`.

- impatto

## 11) Pulizia dead code: rimozione middleware inutilizzato e privatizzazione helper

- motivazione
  - Ridurre il surface pubblico del modulo e rimuovere codice esportato ma non consumato dalle rotte o dai controller.

- fix applicati
  - `src/middleware/validationMiddleware.ts`: rimosso `validateArrayFields` (non referenziato in nessuna rotta/controller).
  - `src/utils/coordinateValidator.ts`: resi interni (non esportati) gli helper `validateCoordinates` e `isValidCoordinate`; continuano a essere usati internamente da `validatePathfindingCoordinates` e `validateCellUpdates`.

- verifica
  - Build e test rieseguiti: OK (tutte le suite e i test passano).

- note
  - Nessun impatto sulle API: le funzioni usate dalle rotte restano esportate (`validateRequiredFields`, `validateModelGrid`, `validateRechargeRequest`, `normalizeCoordinates`, `validatePathfindingCoordinates`, `validateCellUpdates`, `filterCellsWithDifferentValues`).

## 12) Barrel DAO: rimozione export aggregato `daos` e default

- motivazione
  - Ridurre superficie pubblica e ambiguità: il default export `daos` non era referenziato in nessuna parte dell’app. Le rotte e i middleware usano gli export nominati (`utenteDao`, `modelloDao`) o importano direttamente i file specifici.

- fix applicato
  - File: `src/dao/index.ts`
  - Rimosso l’oggetto aggregato `daos` e l’`export default`. Mantenuti gli export nominati:
    - `export { UtenteDao, default as utenteDao } from './UtenteDao'`
    - `export { ModelloDao, default as modelloDao } from './ModelloDao'`
    - `export { RichiestaAggiornamentoDao, default as richiestaAggiornamentoDao } from './RichiestaAggiornamentoDao'`
    - `export { CellaAggiornamentoDao, default as cellaAggiornamentoDao } from './CellaAggiornamentoDao'`

- verifica
  - Build e test: OK (51/51). Nessuna import rotta/middleware/utility dipendeva dall’export di default.

- impatto
  - Nessun cambiamento funzionale. Import più chiari e coerenti; minor rischio di usi errati futuri dell’aggregato.
  - Nessun cambio funzionale o di test; confronti e calcoli restano invariati e più espliciti. Migliorata la coerenza dei tipi nel runtime, evitando ambiguità dovute a `DECIMAL` restituito come stringa dall’ORM.

## 11) Esecuzione A*: validazione centralizzata delle coordinate in `executeModel`

- stato precedente
  - Nel controller `executeModel` la validazione delle coordinate avveniva con due controlli manuali usando `isValidCoordinate(startPos, ...)` e `isValidCoordinate(goalPos, ...)`. Non veniva applicato il controllo semantico “start e goal non possono essere uguali”, già disponibile nell’utility `validatePathfindingCoordinates`.

- motivazione errore
  - Mancata coesione e possibile incoerenza dei messaggi: duplicare la logica di validazione nel controller può generare divergenze rispetto all’utility centralizzata. Inoltre, l’assenza del controllo “start == goal” consente richieste logicamente scorrette.

- patch applicata
  - File: `src/controllers/modelController.ts`
  - Modifiche:
    - Import aggiornato: da `isValidCoordinate, normalizeCoordinates` a `normalizeCoordinates, validatePathfindingCoordinates`.
    - Sostituiti i due blocchi `if` per i limiti della griglia con una singola chiamata: `await validatePathfindingCoordinates(modelId, startPos, goalPos);` che include: verifica limiti per entrambe le coordinate, messaggi standardizzati con dimensioni della griglia e controllo che start e goal non coincidano.

- situazione dopo la modifica
  - La validazione delle coordinate per l’A* è ora centralizzata e coerente con il resto del progetto. Errori per coordinate fuori dai limiti riportano coordinate e dimensioni della griglia; richieste con `start === goal` vengono rifiutate con messaggio esplicito. Ridotta duplicazione e migliorata manutenibilità; nessun impatto sui costi, middleware o test esistenti.
## Rimozione Codice Morto: `hasSufficientTokens` (src/utils/tokenUtils.ts)

- Situazione prima: Funzione definita in `src/utils/tokenUtils.ts` ma non utilizzata da nessun file applicativo; unica occorrenza esterna era una menzione in `README.md`.
- Motivazione: Ridurre rumore e superficie di manutenzione, evitando API ridondanti rispetto a funzioni già presenti (`calculateRemainingTokens`, validazioni in middleware/controller).
- Patch applicata:
  - Rimossa `hasSufficientTokens` da `src/utils/tokenUtils.ts`.
  - Copiata l'implementazione nel file di archivio `deadcode.ts` per riferimento storico.
- Situazione dopo: Nessun impatto funzionale. La verifica della sufficienza dei token resta implicita nelle operazioni che calcolano e validano il saldo e nei flussi di business esistenti.
## Rimozione Codice Morto: `CellaAggiornamentoDao.findById` (src/dao/CellaAggiornamentoDao.ts)

- Situazione prima: Metodo definito nel DAO ma non referenziato nei controller o servizi; l’unica operazione usata è `bulkCreate`.
- Motivazione: Eliminare API inutilizzate per ridurre complessità e rischio di divergenza rispetto ai flussi centralizzati.
- Patch applicata:
  - Rimossa l’implementazione di `findById` da `src/dao/CellaAggiornamentoDao.ts`.
  - Copiata l’implementazione nel file di archivio `deadcode.ts` (`dead_CellaAggiornamentoDao_findById`) per riferimento storico.
- Situazione dopo: Nessun impatto funzionale. Le operazioni sulle celle di aggiornamento continuano a usare `bulkCreate` e query aggregate/bulk dove necessario.
## Rimozione Codice Morto: Metodi inutilizzati in `CellaAggiornamentoDao` (src/dao/CellaAggiornamentoDao.ts)

- Situazione prima: Il DAO per le celle esponeva molte API non referenziate dal codice applicativo; l’unico metodo utilizzato era `bulkCreate` per creare le celle di aggiornamento.
- Metodi rimossi: `create`, `findByRequestId`, `update`, `countByRequestId`, `existsByCoordinatesAndRequest`, `findByCoordinatesAndRequest`, `getUniqueCoordinatesByRequest`, `bulkUpdate`, `findByMultipleRequestIds`.
- Motivazione: Ridurre complessità, prevenire divergenze e semplificare il mantenimento; le operazioni effettive sui flussi di aggiornamento non richiedono queste API.
- Patch applicata:
  - Rimozione dei metodi elencati da `src/dao/CellaAggiornamentoDao.ts` e pulizia import da `Op`.
  - Archiviazione delle implementazioni originali in `deadcode.ts` con prefisso `dead_CellaAggiornamentoDao_*` per riferimento storico.
- Situazione dopo: Il DAO mantiene solo `bulkCreate`, coerente con i controller; nessun impatto funzionale.

## 10) Pulizia codice morto (DAO, Middleware, Utils)

- motivazione
  - Ridurre ambiguità e superficie di manutenzione eliminando metodi/funzioni non referenziati nel codice applicativo o nei test.

- fix applicati
  - `src/dao/ModelloDao.ts`: rimossi `getDimensions` e `areCoordinatesValid` (validazioni gestite da `utils/coordinateValidator`).
  - `src/dao/UtenteDao.ts`: rimosso `findMultipleByIds` (nessun utilizzo).
  - `src/middleware/validateIdMiddleware.ts`: rimossi `validateModelId`, `validateRequestId`, `validateIdArray` (non usati; mantenuti `validateAndCheckModelExists` e `validatePagination`).
  - `src/utils/tokenUtils.ts`: rimossi `calculateRemainingTokens`, `calculateExecutionCost`, `validateTokenAmount`, `parseTokenAmount`, `formatTokensWithUnit`, `calculateTokenUsagePercentage`.

- verifica
  - Build: `npm run build` → OK.
  - Test: `npm test` → 51/51 passati.

- documentazione
  - `deadcode.ts`: aggiunta sezione con elenco metodi rimossi e file di origine.
  - `README.md`: aggiunta nota di “Dead Code Removal” per trasparenza storica.




  Per ridurre codice morto e migliorare la coerenza, sono stati rimossi metodi non referenziati:
- `src/dao/UtenteDao.ts`: `update`, `hasEnoughTokens`, `deductTokens`, `updateTokensAndGetBalance`, `bulkUpdateTokens`, `checkMultipleUsersTokens`.
- `src/dao/RichiestaAggiornamentoDao.ts`: `findByIdWithRelations`, `updateStatus`, `countPendingByModelId`, `countByStatus`, `count`, `isPending`.
- `src/dao/ModelloDao.ts`: `findByCreatorId`, `findAllPaginated`, `getModelInfo`, `getCellValue`.
- `src/utils/jwt.ts`: `verifyToken` (il middleware usa direttamente `jsonwebtoken`).

Aggiornamenti recenti (dead code):
- `src/dao/ModelloDao.ts`: `getDimensions`, `areCoordinatesValid` (validazioni spostate in `utils/coordinateValidator`).
- `src/dao/UtenteDao.ts`: `findMultipleByIds`.
- `src/middleware/validateIdMiddleware.ts`: `validateModelId`, `validateRequestId`, `validateIdArray` (non utilizzati).
- `src/utils/tokenUtils.ts`: `calculateRemainingTokens`, `calculateExecutionCost`, `validateTokenAmount`, `parseTokenAmount`, `formatTokensWithUnit`, `calculateTokenUsagePercentage`.
 - `src/middleware/validationMiddleware.ts`: `validateArrayFields` rimosso (non usato da rotte/controller).
 - `src/utils/coordinateValidator.ts`: `isValidCoordinate` e `validateCoordinates` resi helper interni (non esportati).

## 11) Risoluzione conflitto ENUM tra init.sql e Sequelize

- problema
  - Conflitto tra definizione database e modelli ORM: `db/init.sql` definiva i campi `ruolo` (tabella `Utente`) e `stato` (tabella `RichiestaAggiornamento`) come `VARCHAR` con vincoli `CHECK`, mentre i modelli Sequelize li definivano come `DataTypes.ENUM`. Durante la sincronizzazione, Sequelize tentava di creare tipi enum già esistenti o incompatibili, causando errori `duplicate_object` e `datatype mismatch` che impedivano l'avvio dell'applicazione.

- motivazione
  - Garantire coerenza tra schema database e definizioni ORM per evitare errori di sincronizzazione e permettere il corretto funzionamento dell'applicazione containerizzata. Mantenere i vantaggi degli enum PostgreSQL (performance, validazione a livello DB) allineando init.sql con le aspettative di Sequelize.

- fix applicato
  - Modificato `db/init.sql` per creare esplicitamente i tipi enum prima delle tabelle:
    - Aggiunto `CREATE TYPE "public"."enum_Utente_ruolo" AS ENUM ('user', 'admin')` con gestione `duplicate_object`.
    - Aggiunto `CREATE TYPE "public"."enum_RichiestaAggiornamento_stato" AS ENUM ('pending', 'approved', 'rejected')` con gestione `duplicate_object`.
    - Sostituito `ruolo VARCHAR(50) DEFAULT 'user' CHECK (ruolo IN ('user', 'admin'))` con `ruolo "public"."enum_Utente_ruolo" DEFAULT 'user' NOT NULL`.
    - Sostituito `stato VARCHAR(50) DEFAULT 'pending' CHECK (stato IN ('pending', 'approved', 'rejected'))` con `stato "public"."enum_RichiestaAggiornamento_stato" DEFAULT 'pending' NOT NULL`.
  - Utilizzato il prefisso schema `"public"."` per allinearsi esattamente ai nomi che Sequelize genera automaticamente.

- impatto
  - Risolto il blocco dell'applicazione durante l'avvio dei container Docker.
  - Mantenuta la funzionalità `DEMO_ALLOW_ADMIN_SELF_REGISTER=true` per la presentazione dell'esame.
  - Migliorata coerenza tra database e ORM, eliminando discrepanze di tipo.
  - Test di registrazione utente e admin confermano il corretto funzionamento degli enum.

- verifica
  - Container Docker: `docker-compose up -d` → avvio senza errori.
  - Log backend: nessun errore di migrazione o sincronizzazione.
  - API test: registrazione utente normale e admin funzionanti (status 201).
