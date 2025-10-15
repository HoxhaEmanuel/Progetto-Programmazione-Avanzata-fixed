# 🧪 Test Manuale API - Crown-Sourcing Platform

## 📋 Panoramica

Questo documento contiene il flusso completo di test per tutte le API del Crown-Sourcing Platform. I test sono organizzati in ordine logico per simulare un utilizzo reale del sistema.

## 🔧 Prerequisiti

### Configurazione Postman
1. **Base URL**: `http://localhost:3000`
2. **Variabili Environment**:
   - `baseUrl`: `http://localhost:3000`
   - `userToken`: (verrà popolato automaticamente)
   - `adminToken`: (verrà popolato automaticamente)
   - `modelId`: (verrà popolato automaticamente)
   - `requestId`: (verrà popolato automaticamente)

### Server
- Assicurati che il server sia in esecuzione su `http://localhost:3000`
- Database PostgreSQL configurato e funzionante

---

## 🎯 ORDINE DI ESECUZIONE DEI TEST

### **FASE 1: AUTENTICAZIONE E SETUP INIZIALE**

#### 1.1 Registrazione Utente Normale
```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123"
}
```
**Risultato Atteso**: Status 201, utente creato con 20.00 token

#### 1.2 Registrazione Amministratore (se DEMO_ALLOW_ADMIN_SELF_REGISTER=true)
```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123",
  "ruolo": "admin"
}
```
**Risultato Atteso**: Status 201, admin creato con 20.00 token

#### 1.3 Login Utente Normale
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123"
}
```
**Azione Post-Test**: Salva il `token` nella variabile `userToken`

#### 1.4 Login Amministratore
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}
```
**Azione Post-Test**: Salva il `token` nella variabile `adminToken`

---

### **FASE 2: GESTIONE MODELLI (UTENTE NORMALE)**

#### 2.1 Creazione Primo Modello
```http
POST {{baseUrl}}/api/models
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "nome": "Labirinto Test 1",
  "griglia": [
    [0, 0, 1, 0],
    [1, 0, 1, 0],
    [0, 0, 0, 0],
    [0, 1, 1, 0]
  ]
}
```
**Azione Post-Test**: Salva l'`id` del modello nella variabile `modelId`
**Costo**: 0.80 token (16 celle × 0.05)

#### 2.2 Visualizzazione Modelli Utente
```http
GET {{baseUrl}}/api/models?pagina=1&limite=10
Authorization: Bearer {{userToken}}
```

#### 2.3 Stato del Modello
```http
GET {{baseUrl}}/api/models/{{modelId}}/status
Authorization: Bearer {{userToken}}
```

#### 2.4 Esecuzione Algoritmo A* - Formato Separato
```http
POST {{baseUrl}}/api/models/{{modelId}}/execute
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "startX": 0,
  "startY": 0,
  "goalX": 3,
  "goalY": 3
}
```

#### 2.5 Esecuzione Algoritmo A* - Formato Oggetto
```http
POST {{baseUrl}}/api/models/{{modelId}}/execute
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "start": { "x": 0, "y": 0 },
  "goal": { "x": 3, "y": 2 }
}
```

#### 2.6 Creazione Secondo Modello (per test collaborativi)
```http
POST {{baseUrl}}/api/models
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "nome": "Modello Collaborativo",
  "griglia": [
    [0, 1, 0],
    [0, 1, 0],
    [0, 0, 0]
  ]
}
```
**Azione Post-Test**: Salva l'`id` in una nuova variabile `modelId2`

---

### **FASE 3: SISTEMA COLLABORATIVO**

#### 3.1 Test Modifica Diretta (Creatore del Modello)
```http
POST {{baseUrl}}/api/updates/models/{{modelId}}/request
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "celle": [
    { "x": 1, "y": 1, "nuovo_valore": 0 }
  ]
}
```
**Risultato Atteso**: `"Aggiornamento applicato direttamente"`, costo 0 token
**Nota**: Poiché sei il creatore del modello, la modifica viene applicata immediatamente

#### 3.2 Registrazione Secondo Utente (per Test Collaborativo)
```http
POST {{baseUrl}}/api/auth/register
Content-Type: application/json

{
  "email": "user2@test.com",
  "password": "password123"
}
```

#### 3.3 Login Secondo Utente
```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "user2@test.com",
  "password": "password123"
}
```
**Azione Post-Test**: Salva il `token` nella variabile `user2Token`

#### 3.4 Richiesta di Aggiornamento da Utente Esterno
```http
POST {{baseUrl}}/api/updates/models/{{modelId}}/request
Authorization: Bearer {{user2Token}}
Content-Type: application/json

{
  "celle": [
    { "x": 2, "y": 1, "nuovo_valore": 1 },
    { "x": 0, "y": 2, "nuovo_valore": 0 }
  ]
}
```
**Azione Post-Test**: Salva l'`id` della richiesta nella variabile `requestId`
**Risultato Atteso**: Richiesta pending creata, costo 0.70 token (2 celle × 0.35)

#### 3.5 Visualizzazione Richieste Pending (Creatore del Modello)
```http
GET {{baseUrl}}/api/updates/pending?pagina=1&limite=10
Authorization: Bearer {{userToken}}
```
**Nota**: Solo il creatore del modello vede le richieste pending sui suoi modelli

#### 3.6 Storico Aggiornamenti del Modello
```http
GET {{baseUrl}}/api/updates/models/{{modelId}}/history?pagina=1&limite=10
Authorization: Bearer {{userToken}}
```

#### 3.7 Approvazione/Rifiuto Richieste (Bulk)
```http
PUT {{baseUrl}}/api/updates/approve-reject
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "richieste": [
    { "id": {{requestId}}, "azione": "approve" }
  ]
}
```
**Nota**: Solo il creatore del modello può approvare/rifiutare

#### 3.8 Verifica Stato Modello Dopo Approvazione
```http
GET {{baseUrl}}/api/models/{{modelId}}/status
Authorization: Bearer {{userToken}}
```

---

### **FASE 4: FUNZIONALITÀ AMMINISTRATIVE**

#### 4.1 Statistiche Sistema
```http
GET {{baseUrl}}/api/admin/stats
Authorization: Bearer {{adminToken}}
```

#### 4.2 Lista Tutti gli Utenti
```http
GET {{baseUrl}}/api/admin/users?pagina=1&limite=10
Authorization: Bearer {{adminToken}}
```

#### 4.3 Ricarica Token Utente
```http
POST {{baseUrl}}/api/admin/recharge
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "email": "user@test.com",
  "nuovoSaldo": 50.00
}
```

---

### **FASE 5: TEST DI ERRORE E VALIDAZIONE**

#### 5.1 Test Token Insufficienti
```http
POST {{baseUrl}}/api/models
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "nome": "Modello Costoso",
  "griglia": [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
}
```
**Risultato Atteso**: Status 401, errore token insufficienti

#### 5.2 Test Accesso Non Autorizzato (senza token)
```http
GET {{baseUrl}}/api/models
```
**Risultato Atteso**: Status 401, token richiesto

#### 5.3 Test Accesso Admin con Token Utente
```http
GET {{baseUrl}}/api/admin/stats
Authorization: Bearer {{userToken}}
```
**Risultato Atteso**: Status 403, accesso negato

#### 5.4 Test Modello Inesistente
```http
GET {{baseUrl}}/api/models/99999/status
Authorization: Bearer {{userToken}}
```
**Risultato Atteso**: Status 404, modello non trovato

#### 5.5 Test Coordinate A* Non Valide
```http
POST {{baseUrl}}/api/models/{{modelId}}/execute
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "startX": -1,
  "startY": 0,
  "goalX": 10,
  "goalY": 10
}
```
**Risultato Atteso**: Status 400, coordinate non valide

#### 5.6 Test Griglia Non Valida
```http
POST {{baseUrl}}/api/models
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "nome": "Griglia Invalida",
  "griglia": [
    [0, 1, 2],
    [0, 1]
  ]
}
```
**Risultato Atteso**: Status 400, griglia non valida

---

## 📊 VERIFICA RISULTATI

### Controlli da Effettuare:

1. **Token Economy**:
   - Verifica che i token vengano detratti correttamente
   - Controlla i saldi dopo ogni operazione
   - Testa il sistema di ricarica admin

2. **Sistema Collaborativo**:
   - Verifica che le richieste vengano create correttamente
   - Controlla che le approvazioni aggiornino la griglia
   - Testa la paginazione delle richieste

3. **Algoritmo A***:
   - Verifica che i percorsi calcolati siano corretti
   - Controlla i tempi di esecuzione
   - Testa con diverse configurazioni di griglia

4. **Sicurezza**:
   - Verifica che l'autenticazione funzioni
   - Controlla i permessi admin
   - Testa la validazione degli input

5. **Gestione Errori**:
   - Verifica che gli errori restituiscano codici appropriati
   - Controlla i messaggi di errore
   - Testa i casi limite

---

## 🎯 ORDINE CONSIGLIATO DI ESECUZIONE

1. **Setup**: 1.1 → 1.2 → 1.3 → 1.4
2. **Funzionalità Base**: 2.1 → 2.2 → 2.3 → 2.4 → 2.5
3. **Collaborazione**: 2.6 → 3.1 → 3.2 → 3.3 → 3.4 → 3.5
4. **Amministrazione**: 4.1 → 4.2 → 4.3
5. **Test di Errore**: 5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6

---

## 📝 NOTE IMPORTANTI

- **Salva sempre i token** nelle variabili environment dopo il login
- **Salva gli ID** dei modelli e richieste per i test successivi
- **Controlla i saldi token** dopo ogni operazione che li consuma
- **Verifica i codici di stato** per ogni chiamata
- **Testa sia i casi di successo che di errore**

---

## 🔄 RESET AMBIENTE

Per resettare l'ambiente di test:
1. Riavvia il database o esegui gli script di reset
2. Cancella le variabili environment in Postman
3. Ricomincia dalla Fase 1