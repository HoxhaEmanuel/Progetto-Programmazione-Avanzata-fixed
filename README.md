<div align="center">

# 🏆 Crowd-Sourcing Platform
### Sistema Collaborativo per Algoritmi di Pathfinding A*

*Una piattaforma innovativa per la gestione collaborativa di griglie di pathfinding con sistema di token economy*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

</div>

---

## 📋 Indice

- [🎯 **Obiettivo del Progetto**](#-obiettivo-del-progetto)
- [✨ **Caratteristiche Principali**](#-caratteristiche-principali)
- [🏗️ **Architettura del Sistema**](#️-architettura-del-sistema)
- [📊 **Diagrammi UML**](#-diagrammi-uml)
- [🗄️ **Modello Dati (ER)**](#️-modello-dati-er)
- [🚀 **Installazione e Configurazione**](#-installazione-e-configurazione)
- [🔧 **Utilizzo dell'API**](#-utilizzo-dellapi)
- [🧪 **Testing**](#-testing)
- [📚 **Documentazione API**](#-documentazione-api)
- [🤝 **Contribuire**](#-contribuire)
- [📄 **Licenza**](#-licenza)

---

## 🎯 Obiettivo del Progetto

Il **Crowd-Sourcing Platform** è un sistema innovativo di **crowd-sourcing** per la gestione collaborativa di griglie utilizzate negli algoritmi di pathfinding A*. La piattaforma implementa un ecosistema completo dove gli utenti possono:

### 🎮 Funzionalità Core
- **🗺️ Creazione Modelli**: Progettare griglie personalizzate per algoritmi di pathfinding
- **🎯 Esecuzione A***: Calcolare percorsi ottimali utilizzando l'algoritmo A* con euristica Manhattan
- **🤝 Collaborazione**: Proporre modifiche collaborative alle griglie esistenti
- **⚖️ Sistema di Approvazione**: Approvare o rifiutare richieste di modifica come creatori
- **👑 Gestione Amministrativa**: Controllo completo di utenti, token e statistiche di sistema

### 💰 Token Economy
Il sistema implementa un'economia basata su **token** che incentiva la partecipazione e garantisce la qualità:
- **Costo Creazione**: 0.05 token per cella della griglia
- **Costo Esecuzione**: Equivalente al costo di creazione del modello
- **Sistema di Ricarica**: Gli amministratori possono gestire i saldi degli utenti
- **Saldo Iniziale**: 20.00 token per ogni nuovo utente

---

## ✨ Caratteristiche Principali

### 🔐 Sistema di Autenticazione
- **JWT Authentication**: Autenticazione sicura basata su token JWT
- **Role-Based Access**: Gestione ruoli (User/Admin) con permessi differenziati
- **Middleware di Sicurezza**: Validazione automatica delle richieste e autorizzazioni

### 🎯 Algoritmo A* Avanzato
- **Libreria astar-typescript**: Implementazione ottimizzata dell'algoritmo A*
- **Euristica Manhattan**: Calcolo efficiente delle distanze
- **Movimento Diagonale**: Supporto per percorsi diagonali
- **Metriche di Performance**: Misurazione tempi di esecuzione

### 🗄️ Gestione Dati Avanzata
- **Pattern DAO**: Separazione logica di accesso ai dati
- **Bulk Operations**: Operazioni ottimizzate per grandi volumi
- **Transaction Management**: Gestione transazioni ACID
- **Paginazione Intelligente**: Navigazione efficiente dei risultati

### 🔧 Architettura Robusta
- **Design Patterns**: Factory, Singleton, DAO, MVC
- **Error Handling**: Gestione centralizzata degli errori
- **Validation Middleware**: Validazione automatica input
- **Database Optimization**: Query ottimizzate e indicizzazione

---

## 🏗️ Architettura del Sistema

Il sistema segue il **pattern MVC (Model-View-Controller)** con un'architettura a livelli ben definita:

```mermaid
graph TB
    subgraph "🌐 Presentation Layer"
        API["🔌 REST API Endpoints"]
        MW["🛡️ Middleware Layer"]
    end
    
    subgraph "🧠 Business Logic Layer"
        AC["👤 Auth Controller"]
        MC["🗺️ Model Controller"]
        UC["🔄 Update Controller"]
        ADC["👑 Admin Controller"]
    end
    
    subgraph "📊 Data Access Layer"
        UD["👥 Utente DAO"]
        MD["🗺️ Modello DAO"]
        RD["📝 Richiesta DAO"]
        CD["🔲 Cella DAO"]
    end
    
    subgraph "🗄️ Data Layer"
        DB[("🐘 PostgreSQL\nDatabase")]
    end
    
    subgraph "🔧 Utilities"
        AST["🎯 A* Algorithm"]
        TW["🔄 Transaction Wrapper"]
        VLD["✅ Validators"]
        ERR["❌ Error Factory"]
    end
    
    API --> MW
    MW --> AC
    MW --> MC
    MW --> UC
    MW --> ADC
    
    AC --> UD
    MC --> MD
    MC --> AST
    UC --> RD
    UC --> CD
    ADC --> UD
    ADC --> MD
    ADC --> RD
    
    UD --> DB
    MD --> DB
    RD --> DB
    CD --> DB
    
    MC --> TW
    UC --> TW
    MW --> VLD
    AC --> ERR
    MC --> ERR
    UC --> ERR
    ADC --> ERR
```

---

## 📊 Diagrammi UML

### 🏗️ Diagramma delle Classi - Modelli Sequelize

```mermaid
classDiagram
    %% === SEQUELIZE MODELS ===
    class Model {
        <<abstract>>
        +id: number
        +createdAt: Date
        +updatedAt: Date
        +save()
        +destroy()
        +reload()
    }
    
    class Utente {
        +id: number
        +email: string
        +password: string
        +ruolo: 'user' | 'admin'
        +token_rimanenti: number
        +createdAt: Date
        +updatedAt: Date
    }
    
    class Modello {
        +id: number
        +nome: string
        +griglia: number[][]
        +dimensioni_x: number
        +dimensioni_y: number
        +costo_creazione: number
        +creatore_id: number
        +createdAt: Date
        +updatedAt: Date
    }
    
    class RichiestaAggiornamento {
        +id: number
        +stato: 'pending' | 'approved' | 'rejected'
        +costo_totale: number
        +modello_id: number
        +richiedente_id: number
        +modello?: Modello
        +celle?: CellaAggiornamento[]
        +createdAt: Date
        +updatedAt: Date
    }
    
    class CellaAggiornamento {
        +id: number
        +x: number
        +y: number
        +nuovo_valore: 0 | 1
        +richiesta_id: number
    }
    
    %% === INTERFACES ===
    class UtenteAttributes {
        <<interface>>
        +id: number
        +email: string
        +password: string
        +ruolo: 'user' | 'admin'
        +token_rimanenti: number
    }
    
    class ModelloAttributes {
        <<interface>>
        +id: number
        +nome: string
        +griglia: number[][]
        +dimensioni_y: number
        +dimensioni_x: number
        +costo_creazione: number
        +creatore_id: number
    }
    
    class RichiestaAggiornamentoAttributes {
        <<interface>>
        +id: number
        +stato: 'pending' | 'approved' | 'rejected'
        +costo_totale: number
        +modello_id: number
        +richiedente_id: number
    }
    
    class CellaAggiornamentoAttributes {
        <<interface>>
        +id: number
        +x: number
        +y: number
        +nuovo_valore: 0 | 1
        +richiesta_id: number
    }
    
    %% === INHERITANCE ===
    Model <|-- Utente
    Model <|-- Modello
    Model <|-- RichiestaAggiornamento
    Model <|-- CellaAggiornamento
    
    %% === INTERFACE IMPLEMENTATION ===
    Utente ..|> UtenteAttributes
    Modello ..|> ModelloAttributes
    RichiestaAggiornamento ..|> RichiestaAggiornamentoAttributes
    CellaAggiornamento ..|> CellaAggiornamentoAttributes
    
    %% === ASSOCIATIONS ===
    Utente ||--o{ Modello : "crea"
    Utente ||--o{ RichiestaAggiornamento : "richiede"
    Modello ||--o{ RichiestaAggiornamento : "riceve"
    RichiestaAggiornamento ||--o{ CellaAggiornamento : "contiene"
```

### 🏗️ Diagramma delle Classi - Layer DAO

```mermaid
classDiagram
    %% === DAO CLASSES ===
    class UtenteDao {
        +findById(id: number) Promise~Utente | null~
        +findByEmail(email: string) Promise~Utente | null~
        +create(userData: Optional<UtenteAttributes,'id'>) Promise~Utente~
        +updateTokens(userId: number, newTokenAmount: number) Promise~[number]~
        +findAllWithPagination(limit: number, offset: number) Promise~{ count: number; rows: Utente[] }~
        +deductTokensAndGetBalance(userId: number, amount: number) Promise~number~
        +getTotalTokensInSystem() Promise~number~
        +count() Promise~number~
    }
    
    class ModelloDao {
        +findById(id: number) Promise~Modello | null~
        +create(modelData: Optional<ModelloAttributes,'id'>) Promise~Modello~
        +update(modelId: number, updateData: Partial<ModelloAttributes>) Promise~[number]~
        +updateGrid(modelId: number, newGrid: number[][]) Promise~[number]~
        +findByCreatorIdPaginated(creatorId: number, limit: number, offset: number) Promise~{ rows: Modello[]; count: number }~
        +count() Promise~number~
        +getModelStatusInfo(modelId: number) Promise~{ modello: Modello; pendingRequests: number } | null~
        +isCreator(modelId: number, userId: number) Promise~boolean~
        +findMultipleByIds(modelIds: number[]) Promise~Modello[]~
        +checkMultipleOwnership(modelIds: number[], userId: number) Promise~Map<number, boolean>~
        +getGrid(modelId: number) Promise~number[][] | null~
    }
    
    class RichiestaAggiornamentoDao {
        +findById(id: number, transaction?: Transaction) Promise~RichiestaAggiornamento | null~
        +create(requestData: Optional<RichiestaAggiornamentoAttributes,'id'>, transaction?: Transaction) Promise~RichiestaAggiornamento~
        +update(requestId: number, updateData: Partial<RichiestaAggiornamentoAttributes>, transaction?: Transaction) Promise~[number]~
        +findMultipleByIdsWithRelations(ids: number[], transaction?: Transaction) Promise~RichiestaAggiornamento[]~
        +findPendingByCreatorIdPaginated(creatorId: number, limit: number, offset: number) Promise~{ rows: RichiestaAggiornamento[]; count: number }~
        +findByModelIdWithFiltersPaginated(modelId: number, filters: UpdateFilters, limit: number, offset: number) Promise~{ rows: RichiestaAggiornamento[]; count: number }~
        +getStats() Promise~{ pending: number; approved: number; rejected: number; total: number }~
        +bulkUpdateStatus(updates: Array<{ requestId: number; status: 'approved' | 'rejected' }>, transaction?: Transaction) Promise~void~
    }

    class CellaAggiornamentoDao {
        +bulkCreate(cellsData: Optional<CellaAggiornamentoAttributes,'id'>[], transaction?: Transaction) Promise~CellaAggiornamento[]~
    }
    
    %% === INTERFACES ===
    class TotalTokensResult {
        <<interface>>
        +total_tokens: string | number | null
    }
    
    class UpdateFilters {
        <<interface>>
        +stato?: 'pending' | 'approved' | 'rejected'
        +dataInizio?: Date
        +dataFine?: Date
    }
    
    %% === DEPENDENCIES ===
    UtenteDao --> Utente : "manages"
    ModelloDao --> Modello : "manages"
    RichiestaAggiornamentoDao --> RichiestaAggiornamento : "manages"
    RichiestaAggiornamentoDao --> Modello : "includes"
    RichiestaAggiornamentoDao --> CellaAggiornamento : "includes"
    CellaAggiornamentoDao --> CellaAggiornamento : "manages"
    
    UtenteDao ..> TotalTokensResult : "returns"
    RichiestaAggiornamentoDao ..> UpdateFilters : "uses"
    
    %% === DATABASE CONNECTION ===
    UtenteDao --> Database : "uses"
    ModelloDao --> Database : "uses"
    RichiestaAggiornamentoDao --> Database : "uses"
    CellaAggiornamentoDao --> Database : "uses"
```

### 🏗️ Diagramma delle Classi - Controllers e Middleware

```mermaid
classDiagram
    %% === REQUEST/RESPONSE INTERFACES ===
    class Request {
        <<interface>>
        +body: object
        +params: object
        +query: object
        +headers: object
    }
    
    class Response {
        <<interface>>
        +status(code: number) Response
        +json(data: object) Response
        +send(data: any) Response
    }
    
    class AuthenticatedRequest {
        <<interface>>
        +user?: object
        +requiredTokens?: number
        +modelId?: number
        +requestId?: number
        +userId?: number
        +pagination?: object
    }
    
    class ValidatedRequest {
        <<interface>>
        +modelId?: number
        +requestId?: number
    }
    
    %% === CONTROLLERS ===
    class AuthController {
        +register(req: Request, res: Response) Promise~void~
        +login(req: Request, res: Response) Promise~void~
    }
    
    class ModelController {
        +createModel(req: AuthenticatedRequest, res: Response) Promise~void~
        +executeModel(req: AuthenticatedRequest, res: Response) Promise~void~
        +getModelStatus(req: AuthenticatedRequest, res: Response) Promise~void~
        +getUserModels(req: AuthenticatedRequest, res: Response) Promise~void~
    }
    
    class UpdateController {
        +requestCellUpdate(req: AuthenticatedRequest, res: Response) Promise~void~
        +approveRejectRequests(req: AuthenticatedRequest, res: Response) Promise~void~
        +getPendingRequests(req: AuthenticatedRequest, res: Response) Promise~void~
        +getModelUpdates(req: AuthenticatedRequest, res: Response) Promise~void~
    }
    
    class AdminController {
        +rechargeUserTokens(req: AuthenticatedRequest, res: Response) Promise~void~
        +getSystemStats(req: AuthenticatedRequest, res: Response) Promise~void~
        +getAllUsers(req: AuthenticatedRequest, res: Response) Promise~void~
    }
    
    %% === MIDDLEWARE ===
    class AuthMiddleware {
        +authenticateToken(req: AuthenticatedRequest, res: Response, next: Function) Promise~void~
        +requireAdmin(req: AuthenticatedRequest, res: Response, next: Function) Promise~void~
        +requireTokens(requiredTokens: number | (req: AuthenticatedRequest) => Promise<number>) Function
    }
    
    class ValidationMiddleware {
        +validateEmailPassword(req: Request, res: Response, next: Function) void
        +validateRequiredFields(fields: string[]) Function
        +validateModelGrid(req: Request, res: Response, next: Function) void
        +validateRechargeRequest(req: Request, res: Response, next: Function) void
    }
    
    class ValidateIdMiddleware {
        +validateAndCheckModelExists(req: ValidatedRequest, res: Response, next: Function) Promise~void~
        +validatePagination(req: ValidatedRequest, res: Response, next: Function) void
    }
    
    class ErrorHandlerMiddleware {
        +errorHandler(err: Error, req: Request, res: Response, next: Function) void
        +notFoundHandler(req: Request, res: Response, next: Function) void
    }
    
    %% === INHERITANCE ===
    Request <|-- AuthenticatedRequest
    AuthenticatedRequest <|-- ValidatedRequest
    
    %% === DEPENDENCIES ===
    AuthController --> UtenteDao : "uses"
    ModelController --> ModelloDao : "uses"
    ModelController --> UtenteDao : "uses"
    UpdateController --> RichiestaAggiornamentoDao : "uses"
    UpdateController --> CellaAggiornamentoDao : "uses"
    UpdateController --> ModelloDao : "uses"
    AdminController --> UtenteDao : "uses"
    AdminController --> ModelloDao : "uses"
    
    AuthMiddleware --> UtenteDao : "uses"
    ValidateIdMiddleware --> ModelloDao : "uses"
```

### 🏗️ Diagramma delle Classi - Utilities e Error Handling

```mermaid
classDiagram
    %% === ERROR CLASSES ===
    class Error {
        <<built-in>>
        +message: string
        +name: string
        +stack?: string
    }
    
    class AppError {
        +message: string
        +statusCode: number
        +type: ErrorTypes
        +isOperational: boolean
        +constructor(message: string, statusCode: number, type: ErrorTypes)
    }
    
    class ErrorTypes {
        <<enumeration>>
        BadRequest
        Unauthorized
        Forbidden
        NotFound
        Conflict
        UnprocessableEntity
        InternalServerError
        InsufficientTokens
        ValidationError
    }
    
    class ErrorFactory {
        +createError(type: ErrorTypes, message: string, customStatusCode?: number) AppError
        +createValidationError(field: string, value: unknown, constraint: string) AppError
        +createInsufficientTokensError(required: number, available: number) AppError
        +createUnauthorizedError(reason?: string) AppError
        +createNotFoundError(resource: string, identifier?: string | number) AppError
        -getStatusCodeForType(type: ErrorTypes) number
    }
    
    %% === UTILITY CLASSES ===
    class Database {
        -static instance: Sequelize
        +static getInstance() Sequelize
    }
    
    class CoordinateValidator {
        +static validatePathfindingCoordinates(modelId: number, start: Coordinate, goal: Coordinate, transaction?: Transaction) Promise~void~
        +static validateCellUpdates(modelId: number, cells: CoordinateWithValue[], transaction?: Transaction) Promise~void~
        +static filterCellsWithDifferentValues(modelId: number, cells: CoordinateWithValue[], transaction?: Transaction) Promise~CoordinateWithValue[]~
        +static normalizeCoordinates(input: object) object
    }
    
    class TokenUtils {
        +static formatTokenBalance(balance: number | string) string
        +static calculateModelCreationCost(width: number, height: number) number
        +static calculateUpdateCost(cellCount: number, isCreator?: boolean) number
    }

    class JWT {
        +static generateToken(payload: object) string
    }
    
    class TransactionWrapper {
        +static withTransaction~T~(callback: (transaction: Transaction) => Promise~T~, options?: TransactionOptions) Promise~T~
    }
    
    %% === INTERFACES ===
    class Coordinate {
        <<interface>>
        +x: number
        +y: number
    }
    
    class CoordinateWithValue {
        <<interface>>
        +x: number
        +y: number
        +nuovo_valore: 0 | 1
    }
    
    class TransactionOptions {
        <<interface>>
        +errorHandler?: Function
        +timeout?: number
        +isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
    }
    
    %% === INHERITANCE ===
    Error <|-- AppError
    
    %% === DEPENDENCIES ===
    ErrorFactory --> AppError : "creates"
    ErrorFactory --> ErrorTypes : "uses"
    AppError --> ErrorTypes : "uses"
    
    CoordinateValidator ..> Coordinate : "uses"
    CoordinateValidator ..> CoordinateWithValue : "uses"
    TransactionWrapper ..> TransactionOptions : "uses"
```

### 🎭 Diagramma dei Casi d'Uso

```mermaid
graph LR
    subgraph "👤 Attori"
        U["🧑‍💻 Utente"]
        A["👑 Amministratore"]
    end
    
    subgraph "🎯 Sistema Crown-Sourcing"
        subgraph "🔐 Autenticazione"
            UC1["📝 Registrazione"]
            UC2["🔑 Login"]
        end
        
        subgraph "🗺️ Gestione Modelli"
            UC3["➕ Crea Modello"]
            UC4["🎯 Esegui A*"]
            UC5["📊 Visualizza Modelli"]
            UC6["📈 Stato Modello"]
        end
        
        subgraph "🔄 Sistema Collaborativo"
            UC7["📝 Richiedi Aggiornamento"]
            UC8["✅ Approva/Rifiuta"]
            UC9["📋 Visualizza Richieste"]
            UC10["📊 Storico Aggiornamenti"]
        end
        
        subgraph "👑 Amministrazione"
            UC11["💰 Ricarica Token"]
            UC12["📊 Statistiche Sistema"]
            UC13["👥 Visualizza Utenti"]
        end
    end
    
    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10
    
    A --> UC1
    A --> UC2
    A --> UC3
    A --> UC4
    A --> UC5
    A --> UC6
    A --> UC7
    A --> UC8
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
    A --> UC13
```

### 🔄 Diagramma di Sequenza - Creazione ed Esecuzione Modello

```mermaid
sequenceDiagram
    participant U as Utente
    participant API as API Gateway
    participant MC as Model Controller
    participant UDAO as Utente DAO
    participant MDAO as Modello DAO
    participant AStar as A* Engine
    participant DB as Database
    
    Note over U,DB: Fase 1: Creazione Modello
    
    U->>+API: POST /api/models
    Note right of U: {nome, griglia}
    API->>+MC: createModel()
    Note over MC,DB: Operazione atomica in transazione
    MC->>+UDAO: deductTokensAndGetBalance()
    UDAO->>+DB: UPDATE token_rimanenti
    DB-->>-UDAO: nuovo saldo
    UDAO-->>-MC: saldo aggiornato
    MC->>+MDAO: create(modelData)
    MDAO->>+DB: INSERT modello
    DB-->>-MDAO: modello creato
    MDAO-->>-MC: nuovo modello
    MC-->>-API: {modello, costo, token_rimanenti}
    API-->>-U: 201 Created
    
    Note over U,DB: Fase 2: Esecuzione A*
    
    U->>+API: POST /api/models/:id/execute
    Note right of U: {start, goal}
    API->>+MC: executeModel()
    MC->>+MDAO: findById(modelId)
    MDAO->>+DB: SELECT modello
    DB-->>-MDAO: dati modello
    MDAO-->>-MC: modello
    MC->>+AStar: findPath(start, goal, grid)
    AStar-->>-MC: percorso ottimale
    MC->>+UDAO: deductTokensAndGetBalance()
    UDAO->>+DB: UPDATE token_rimanenti
    DB-->>-UDAO: nuovo saldo
    UDAO-->>-MC: saldo aggiornato
    MC-->>-API: {percorso, costo, tempo, token}
    API-->>-U: 200 OK
```

### 🤝 Diagramma di Sequenza - Sistema Collaborativo

```mermaid
sequenceDiagram
    participant U1 as Utente 1 (Richiedente)
    participant U2 as Utente 2 (Creatore)
    participant API as API Gateway
    participant UC as Update Controller
    participant UDAO as Utente DAO
    participant RDAO as Richiesta DAO
    participant CDAO as Cella DAO
    participant MDAO as Modello DAO
    participant DB as Database
    
    Note over U1,DB: Fase 1: Richiesta Aggiornamento
    
    U1->>+API: POST /api/updates/models/:id/request
    Note right of U1: {celle: [{x,y,nuovo_valore}]}
    API->>+UC: requestCellUpdate()
    alt utente è creatore
        UC->>+MDAO: getGrid(modelId)
        MDAO->>+DB: SELECT griglia
        DB-->>-MDAO: griglia attuale
        UC->>+MDAO: updateGrid(modelId, nuovaGriglia)
        MDAO->>+DB: UPDATE griglia
        DB-->>-MDAO: griglia aggiornata
        UC-->>-API: {messaggio, costo_token: 0, token_rimanenti}
        API-->>-U1: 200 OK
    else utente non è creatore
        UC->>+UDAO: deductTokensAndGetBalance()
        UDAO->>+DB: UPDATE token_rimanenti
        DB-->>-UDAO: nuovo saldo
        UDAO-->>-UC: saldo aggiornato
        UC->>+RDAO: create(richiestaData)
        RDAO->>+DB: INSERT richiesta_aggiornamento
        DB-->>-RDAO: richiesta creata
        RDAO-->>-UC: nuova richiesta
        UC->>+CDAO: bulkCreate(celleData filtrate)
        CDAO->>+DB: INSERT celle_aggiornamento
        DB-->>-CDAO: celle create
        CDAO-->>-UC: celle salvate
        UC-->>-API: {richiesta_id, costo_totale, token_rimanenti}
        API-->>-U1: 201 Created
    end
    
    Note over U1,DB: Fase 2: Visualizzazione Richieste
    
    U2->>+API: GET /api/updates/pending
    API->>+UC: getPendingRequests()
    UC->>+RDAO: findPendingByCreatorIdPaginated()
    RDAO->>+DB: SELECT richieste WHERE stato='pending'
    DB-->>-RDAO: richieste pending
    RDAO-->>-UC: lista richieste
    UC-->>-API: {richieste, paginazione}
    API-->>-U2: 200 OK
    
    Note over U1,DB: Fase 3: Approvazione/Rifiuto (Bulk Operations)
    
    U2->>+API: PUT /api/updates/approve-reject
    Note right of U2: {richieste: [{id, azione}]}
    API->>+UC: approveRejectRequests()
    
    UC->>+RDAO: findMultipleByIdsWithRelations()
    RDAO->>+DB: SELECT richieste con relazioni
    DB-->>-RDAO: richieste con dati
    RDAO-->>-UC: richieste complete
    
    UC->>+MDAO: checkMultipleOwnership()
    MDAO->>+DB: SELECT modelli per ownership
    DB-->>-MDAO: dati ownership
    MDAO-->>-UC: mappa ownership
    
    Note over UC: Raggruppa approvazioni e rifiuti
    
    alt ha approvazioni
        UC->>+MDAO: updateGrid() per ogni modello
        MDAO->>+DB: UPDATE griglia modelli
        DB-->>-MDAO: griglie aggiornate
        MDAO-->>-UC: aggiornamenti completati
    end
    
    UC->>+RDAO: bulkUpdateStatus()
    RDAO->>+DB: UPDATE stati in bulk
    DB-->>-RDAO: stati aggiornati
    RDAO-->>-UC: bulk update completato
    
    UC-->>-API: {richieste_elaborate}
    API-->>-U2: 200 OK
```

---

## 🗄️ Modello Dati (ER)

```mermaid
erDiagram
    UTENTE {
        int id PK
        string email UK
        string password
        enum ruolo
        decimal token_rimanenti
        timestamp createdAt
        timestamp updatedAt
    }
    
    MODELLO {
        int id PK
        string nome
        json griglia
        int dimensioni_x
        int dimensioni_y
        decimal costo_creazione
        int creatore_id FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    RICHIESTA_AGGIORNAMENTO {
        int id PK
        enum stato
        decimal costo_totale
        int modello_id FK
        int richiedente_id FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    CELLA_AGGIORNAMENTO {
        int id PK
        int x
        int y
        int nuovo_valore
        int richiesta_id FK
    }
    
    UTENTE ||--o{ MODELLO : "crea"
    UTENTE ||--o{ RICHIESTA_AGGIORNAMENTO : "richiede"
    MODELLO ||--o{ RICHIESTA_AGGIORNAMENTO : "riceve"
    RICHIESTA_AGGIORNAMENTO ||--o{ CELLA_AGGIORNAMENTO : "contiene"
```

### 📋 Descrizione Entità

#### 👤 **UTENTE**
- **Ruoli**: `user` (utente standard) | `admin` (amministratore)
- **Token Economy**: Saldo iniziale 20.00, gestione automatica deduzioni
- **Sicurezza**: Password hashate con bcrypt, autenticazione JWT

#### 🗺️ **MODELLO**
- **Griglia**: Matrice JSON di 0 (libero) e 1 (ostacolo)
- **Dimensioni**: Larghezza (x) e altezza (y) della griglia
- **Costo**: Calcolato come 0.05 × numero_celle

#### 📝 **RICHIESTA_AGGIORNAMENTO**
- **Stati**: `pending` (in attesa) | `approved` (approvata) | `rejected` (rifiutata)
- **Workflow**: Creazione → Revisione → Approvazione/Rifiuto
- **Costo**: 0.35 × numero_celle effettivamente modificate (creatore gratis)

#### 🔲 **CELLA_AGGIORNAMENTO**
- **Coordinate**: Posizione (x,y) nella griglia
- **Valore**: 0 (libero) o 1 (ostacolo)
- **Validazione**: Controllo bounds e differenza con valore esistente

---

---

## 🚀 Installazione e Configurazione

### 📋 Prerequisiti

| Componente | Versione Minima | Raccomandato |
|------------|----------------|-------------|
| **Node.js** | 18.0+ | 20.0+ |
| **PostgreSQL** | 12.0+ | 15.0+ |
| **npm** | 8.0+ | 10.0+ |
| **Docker** | 20.0+ | 24.0+ (opzionale) |

### ⚡ Installazione Rapida

#### 🐳 **Opzione 1: Docker (Raccomandato)**

```bash
# 1. Clona il repository
git clone <repository-url>
cd Progetto_crown-sourcing

# 2. Avvia tutti i servizi
docker-compose up -d

# 3. Verifica che tutto funzioni
curl http://localhost:3000/api/health
```

#### 💻 **Opzione 2: Installazione Locale**

```bash
# 1. Clona il repository
git clone <repository-url>
cd Progetto_crown-sourcing

# 2. Installa le dipendenze
npm install

# 3. Configura l'ambiente
cp .env.example .env
# Modifica .env con i tuoi parametri

# 4. Configura il database
npm run db:setup

# 5. Avvia l'applicazione
npm run dev
```

### ⚙️ Configurazione Dettagliata

#### 🔧 **Variabili d'Ambiente**

Crea un file `.env` nella root del progetto:

```env
# 🗄️ Database Configuration
DB_NAME=crowdsourcing_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_DIALECT=postgres

# 🔐 Security Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# 🌐 Server Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=/api

# 📊 Performance
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_ACQUIRE_TIMEOUT=30000
DB_IDLE_TIMEOUT=10000
```

#### 📊 **Tabella Configurazioni**

| Categoria | Variabile | Descrizione | Default | Obbligatoria |
|-----------|-----------|-------------|---------|-------------|
| **Database** | `DB_NAME` | Nome database | `crowdsourcing_db` | ✅ |
| | `DB_USER` | Username database | `postgres` | ✅ |
| | `DB_PASSWORD` | Password database | - | ✅ |
| | `DB_HOST` | Host database | `localhost` | ❌ |
| | `DB_PORT` | Porta database | `5432` | ❌ |
| **Security** | `JWT_SECRET` | Chiave JWT (min 32 char) | - | ✅ |
| **Server** | `PORT` | Porta server | `3000` | ❌ |
| | `NODE_ENV` | Ambiente | `development` | ❌ |

Nota: alcuni parametri sono attualmente fissi a livello di codice e non configurabili via `.env`:
- Durata JWT: `1h` (vedi `src/utils/jwt.ts`)
- Rounds bcrypt: `10` (vedi `bcrypt.hash(..., 10)` in `src/controllers/authController.ts`)
- Token iniziali utente: `20.00`
- Costi token: `0.05` per cella (creazione ed esecuzione A*), `0.35` per cella per richieste di aggiornamento dei non‑creatori; i creatori non pagano gli aggiornamenti.

### 🗄️ Setup Database

#### **Configurazione PostgreSQL**

```bash
# Installa PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Avvia il servizio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crea database e utente
sudo -u postgres psql
CREATE DATABASE crowdsourcing_db;
CREATE USER crown_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE crowdsourcing_db TO crown_user;
\q
```

#### **Inizializzazione Schema**

```bash
# Sincronizza schema database
npm run db:sync

# Popola con dati di esempio (opzionale)
npm run db:seed

# Reset completo database (ATTENZIONE: cancella tutti i dati)
npm run db:reset
```

### 🚀 Comandi Disponibili

```bash
# 🔧 Sviluppo
npm run dev          # Avvia in modalità sviluppo con hot-reload
npm run dev:debug    # Avvia con debugger abilitato
npm run build        # Compila TypeScript
npm run start        # Avvia in modalità produzione

# 🗄️ Database
npm run db:setup     # Setup completo database
npm run db:sync      # Sincronizza schema
npm run db:seed      # Popola dati esempio
npm run db:reset     # Reset completo
npm run db:backup    # Backup database

# 🧪 Testing
npm run test         # Esegui tutti i test
npm run test:unit    # Test unitari
npm run test:integration # Test integrazione
npm run test:coverage    # Coverage report

# 📊 Qualità Codice
npm run lint         # Linting ESLint
npm run lint:fix     # Fix automatico
npm run format       # Formattazione Prettier
npm run type-check   # Controllo TypeScript

# 🐳 Docker
npm run docker:build # Build immagine Docker
npm run docker:up    # Avvia con Docker Compose
npm run docker:down  # Ferma servizi Docker
npm run docker:logs  # Visualizza logs
```

### 🔍 Verifica Installazione

```bash
# Controlla stato servizi
curl http://localhost:3000/api/health

# Response attesa:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}

# Test endpoint autenticazione
# Registrazione standard (il campo ruolo inviato dal client viene ignorato)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Modalità DEMO: consente la creazione come admin se
# DEMO_ALLOW_ADMIN_SELF_REGISTER=true ed è inviato ruolo=admin
# (solo per presentazione/esame, NON in produzione)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-demo@example.com",
    "password": "password123",
    "ruolo": "admin"
  }'
```

---

## 🔧 Utilizzo dell'API

### 🔐 **Autenticazione**

Tutti gli endpoint (eccetto registrazione e login) richiedono autenticazione JWT.

#### **Header di Autenticazione**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### **Registrazione Utente**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "utente@example.com",
  "password": "password123",
  "ruolo": "user"  // "user" | "admin"
}
```

**Response (201 Created)**:
```json
{
  "message": "Utente registrato con successo",
  "user": {
    "id": 1,
    "email": "utente@example.com",
    "token_rimanenti": "20.00"
  }
}
```

#### **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "utente@example.com",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "message": "Login effettuato con successo",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "utente@example.com",
    "ruolo": "user",
    "token_rimanenti": "19.20"
  }
}
```

### 🗺️ **Gestione Modelli**

#### **Creazione Modello**
```http
POST /api/models
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Labirinto Test",
  "griglia": [
    [0, 1, 0, 0],
    [0, 1, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 0, 0]
  ]
}
```

**Response (201 Created)**:
```json
{
  "message": "Modello creato con successo",
  "modello": {
    "id": 1,
    "nome": "Labirinto Test",
    "dimensioni_y": 4,
    "dimensioni_x": 4,
    "creatore_id": 1
  },
  "costo_creazione": 0.80,
  "token_rimanenti": "19.20"
}
```

#### **Lista Modelli Utente**
```http
GET /api/models?page=1&limit=10
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "modelli": [
    {
      "id": 1,
      "nome": "Labirinto Test",
      "dimensioni_x": 4,
      "dimensioni_y": 4,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "paginazione": {
    "pagina_corrente": 1,
    "elementi_per_pagina": 10,
    "totale_elementi": 1,
    "totale_pagine": 1
  }
}
```

#### **Esecuzione Algoritmo A***
```http
POST /api/models/1/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "startX": 0,
  "startY": 0,
  "goalX": 3,
  "goalY": 3
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "modello_id": 1,
  "start": {"x": 0, "y": 0},
  "goal": {"x": 3, "y": 3},
  "percorso": [
    {"x": 0, "y": 0},
    {"x": 0, "y": 1},
    {"x": 0, "y": 2},
    {"x": 1, "y": 2},
    {"x": 2, "y": 2},
    {"x": 3, "y": 2},
    {"x": 3, "y": 3}
  ],
  "costo_percorso": 6,
  "tempo_esecuzione_ms": 2.45,
  "costo_token": 0.80,
  "token_rimanenti": "18.40",
  "percorso_trovato": true
}
```

### 🔄 **Sistema Aggiornamenti Collaborativi**

#### **Richiesta Aggiornamento**
```http
POST /api/updates/models/1/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "celle": [
    {"x": 1, "y": 1, "nuovo_valore": 0},
    {"x": 2, "y": 2, "nuovo_valore": 1}
  ]
}
```

**Response (201 Created)**:
```json
{
  "messaggio": "Richiesta di aggiornamento creata",
  "richiesta_id": 1,
  "modello_id": 1,
  "celle_richieste": 2,
  "costo_token": 0.70,
  "token_rimanenti": "18.30",
  "stato": "pending"
}
```
Nota: se il richiedente è il creatore del modello, l’aggiornamento viene applicato direttamente e la risposta è:
```json
{
  "messaggio": "Aggiornamento applicato direttamente",
  "modello_id": 1,
  "celle_aggiornate": 2,
  "costo_token": 0,
  "token_rimanenti": "19.20"
}
```

#### **Richieste in Sospeso (Solo Creatori)**
```http
GET /api/updates/pending?page=1&limit=10
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "richieste_pending": [
    {
      "id": 1,
      "stato": "pending",
      "costo_totale": "0.70",
      "modello": {
        "id": 1,
        "nome": "Labirinto Test"
      },
      "richiedente": {
        "id": 2,
        "email": "altro@example.com"
      },
      "celle": [
        {"x": 1, "y": 1, "nuovo_valore": 0},
        {"x": 2, "y": 2, "nuovo_valore": 1}
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "paginazione": {
    "pagina_corrente": 1,
    "elementi_per_pagina": 10,
    "totale_elementi": 1,
    "totale_pagine": 1
  }
}
```

#### **Approvazione/Rifiuto Richieste**
```http
PUT /api/updates/approve-reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "richieste": [
    {"id": 1, "azione": "approve"},
    {"id": 2, "azione": "reject"}
  ]
}
```

**Response (200 OK)**:
```json
{
  "messaggio": "Richieste elaborate con bulk operations",
  "risultati": [
    {
      "richiesta_id": 1,
      "stato": "approved",
      "celle_aggiornate": 2
    },
    {
      "richiesta_id": 2,
      "stato": "rejected"
    }
  ],
  "totale_elaborate": 2,
  "performance": {
    "richieste_approvate": 1,
    "richieste_rigettate": 1,
    "modelli_aggiornati": 1
  }
}
```

#### **Storico Aggiornamenti Modello**
```http
GET /api/updates/models/1/history?stato=pending&page=1&limit=10
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "modello_id": 1,
  "aggiornamenti": [
    {
      "id": 10,
      "stato": "approved",
      "costo_totale": 0.70,
      "richiedente": { "id": 2, "email": "altro@example.com" },
      "celle": [
        {"x": 1, "y": 1, "nuovo_valore": 0},
        {"x": 2, "y": 2, "nuovo_valore": 1}
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totale": 1,
  "paginazione": {
    "pagina_corrente": 1,
    "elementi_per_pagina": 10,
    "totale_elementi": 1,
    "totale_pagine": 1
  },
  "filtri_applicati": {
    "data_inizio": null,
    "data_fine": null,
    "stato": "pending"
  }
}
```

### 👑 **Funzionalità Amministrative**

#### **Ricarica Token Utente**
```http
POST /api/admin/recharge
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "utente@example.com",
  "nuovoSaldo": 100.00
}
```

**Response (200 OK)**:
```json
{
  "message": "Saldo aggiornato con successo",
  "utente": {
    "id": 1,
    "email": "utente@example.com",
    "saldo_precedente": "5.20",
    "token_rimanenti": 100.00,
    "differenza": 94.80
  },
  "operazione_effettuata_da": {
    "admin_id": 2,
    "admin_email": "admin@example.com"
  }
}
```

#### **Statistiche Sistema**
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "utenti": {
    "totale": 150
  },
  "modelli": {
    "totale": 89
  },
  "richieste_aggiornamento": {
    "pending": 12,
    "approved": 8,
    "rejected": 3,
    "total": 23
  },
  "economia": {
    "token_totali_sistema": "15420.50"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 📊 **Codici di Stato HTTP**

| Codice | Significato | Quando |
|--------|-------------|--------|
| **200** | OK | Operazione completata con successo |
| **201** | Created | Risorsa creata (registrazione, modello, richiesta) |
| **400** | Bad Request | Dati input non validi |
| **401** | Unauthorized | Token mancante o non valido; token insufficienti |
| **403** | Forbidden | Permessi insufficienti |
| **404** | Not Found | Risorsa non trovata |
| **409** | Conflict | Email già esistente, richiesta duplicata |
| **422** | Unprocessable Entity | Non usato |
| **500** | Internal Server Error | Errore interno del server |

### 🚨 **Gestione Errori**

**Formato Standard Errore**:
```json
{
  "error": {
    "type": "INSUFFICIENT_TOKENS",
    "message": "Token insufficienti per l'operazione",
    "details": {
      "richiesti": "0.80",
      "disponibili": "0.50"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Tipi di Errore Comuni**:
- `VALIDATION_ERROR`: Dati input non validi
- `INSUFFICIENT_TOKENS`: Token insufficienti
- `NOT_FOUND`: Risorsa non trovata
- `UNAUTHORIZED`: Autenticazione fallita
- `FORBIDDEN`: Permessi insufficienti
- `DUPLICATE_EMAIL`: Email già registrata

**Note di Robustezza**
- I campi token utente sono memorizzati come `DECIMAL(10,2)` a livello ORM. Il middleware di autenticazione normalizza `token_rimanenti` a numero (`number`) per garantire confronti e calcoli coerenti e prevenire ambiguità da stringhe numeriche.
- Le coordinate per l’esecuzione A* supportano sia chiavi separate (`startX`, `startY`, `goalX`, `goalY`) sia oggetti: `{start:{x,y}, goal:{x,y}}` e `{start:{x,y}, end:{x,y}}`. Gli errori di validazione indicano chiaramente i formati accettati.

---

## 🧪 Testing

### 🎯 **Strategia di Testing**

Il progetto implementa una strategia di testing completa su più livelli:

```mermaid
graph TD
    A[🧪 Testing Strategy] --> B[Unit Tests]
    A --> C[Integration Tests]
    A --> D[E2E Tests]
    A --> E[Performance Tests]
    
    B --> B1[Controllers]
    B --> B2[Services]
    B --> B3[Utils]
    B --> B4[Validators]
    
    C --> C1[Database]
    C --> C2[API Endpoints]
    C --> C3[Authentication]
    
    D --> D1[User Flows]
    D --> D2[Admin Flows]
    D --> D3[A* Algorithm]
    
    E --> E1[Load Testing]
    E --> E2[Stress Testing]
    E --> E3[Memory Usage]
```

### 🔬 **Test Unitari**

```bash
# Esegui tutti i test unitari
npm run test:unit

# Test con coverage
npm run test:coverage

# Test in modalità watch
npm run test:watch

# Test specifici
npm run test -- --grep "AuthController"
```

**Struttura Test**:
```
tests/
├── unit/
│   ├── controllers/
│   │   ├── authController.test.ts
│   │   ├── modelController.test.ts
│   │   ├── adminController.test.ts
│   │   └── updateController.test.ts
│   ├── services/
│   │   ├── astarService.test.ts
│   │   └── tokenService.test.ts
│   ├── utils/
│   │   ├── coordinateValidator.test.ts
│   │   └── errorFactory.test.ts
│   └── middleware/
│       ├── authMiddleware.test.ts
│       └── validationMiddleware.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.integration.test.ts
│   │   ├── models.integration.test.ts
│   │   └── updates.integration.test.ts
│   └── database/
│       ├── dao.integration.test.ts
│       └── transactions.integration.test.ts
├── e2e/
│   ├── userJourney.e2e.test.ts
│   ├── adminJourney.e2e.test.ts
│   └── collaborativeFlow.e2e.test.ts
└── performance/
    ├── astar.performance.test.ts
    └── api.load.test.ts
```

### 🔗 **Test di Integrazione**

```bash
# Setup database di test
npm run test:db:setup

# Esegui test integrazione
npm run test:integration

# Cleanup dopo test
npm run test:db:cleanup
```

**Esempio Test API**:
```typescript
describe('Model API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  it('should create model and execute A* algorithm', async () => {
    // Registrazione utente
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        ruolo: 'user'
      });
    
    const { token } = registerResponse.body;
    
    // Creazione modello
    const modelResponse = await request(app)
      .post('/api/models')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Test Grid',
        griglia: [[0, 1], [0, 0]]
      });
    
    expect(modelResponse.status).toBe(201);
    
    // Esecuzione A*
    const executeResponse = await request(app)
      .post(`/api/models/${modelResponse.body.modello.id}/execute`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        startX: 0, startY: 0,
        goalX: 1, goalY: 1
      });
    
    expect(executeResponse.status).toBe(200);
    expect(executeResponse.body.percorso).toBeDefined();
  });
});
```


```
### 📊 **Coverage Report**

```bash
# Genera report coverage
npm run test:coverage

# Apri report HTML
npm run test:coverage:open
```



---


### 📋 **Linee Guida**



   ```

**💻 Sviluppa e Testa**
   ```bash
   # Installa dipendenze
   npm install
   
   # Avvia in modalità sviluppo
   npm run dev
   
   # Esegui test
   npm run test
   npm run lint
   ```





### 📏 **Standard di Codice**

- **TypeScript**: Strict mode abilitato
- **ESLint**: Configurazione Airbnb
- **Prettier**: Formattazione automatica
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Standard commit

```bash
# Verifica qualità codice
npm run lint          # ESLint check
npm run lint:fix      # Fix automatico
npm run format        # Prettier format
npm run type-check    # TypeScript check
```


---

## 📄 Licenza

```
MIT License

Copyright (c) 2024 Crown-Sourcing Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHERS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---



### 👥 **Team di Sviluppo**

| Ruolo | Nome | Email | GitHub |
|-------|------|-------|--------|

| **Backend Developer** | [Emanuel Hoxha] | emanuel5@live.it | [@HoxhaEmanuel](https://github.com/HoxhaEmanuel) |
## 🔐 Politica Ruoli e Opzione Demo

- Ruoli supportati: `user`, `admin`. A livello ORM il campo `ruolo` è tipizzato come `ENUM('user','admin')`, coerente con le regole SQL e le lezioni del corso.
- Registrazione: per impostazione predefinita, tutti i nuovi utenti vengono creati con ruolo `user` (il valore del campo `ruolo` inviato dal client viene ignorato).
- Opzione demo: per esigenze di presentazione, è possibile abilitare temporaneamente l'auto-registrazione come admin impostando la variabile d’ambiente `DEMO_ALLOW_ADMIN_SELF_REGISTER=true`. In tal caso, se il client invia `{"ruolo": "admin"}` durante la registrazione, l’utente verrà creato come admin.
- Sicurezza: questa opzione è pensata esclusivamente per demo/esami. In produzione deve essere disattivata (`false` o non impostata).

### Variabili d’ambiente rilevanti

- `DEMO_ALLOW_ADMIN_SELF_REGISTER` (default: `false`): abilita l’auto-registrazione come admin solo per scopi dimostrativi.

