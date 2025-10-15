const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Utente, Modello, RichiestaAggiornamento, CellaAggiornamento } = require('../src/models');

describe('Updates API', () => {
  let authToken1, authToken2;
  let userId1, userId2;
  let modelId;

  beforeAll(async () => {
    // Pulisci il database prima dei test
    await CellaAggiornamento.destroy({ where: {}, cascade: true });
    await RichiestaAggiornamento.destroy({ where: {}, cascade: true });
    await Modello.destroy({ where: {}, cascade: true });
    await Utente.destroy({ where: {}, cascade: true });

    // Crea due utenti direttamente nel database
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user1 = await Utente.create({
      email: 'user1@example.com',
      password: hashedPassword,
      token_rimanenti: 1000
    });
    const user2 = await Utente.create({
      email: 'user2@example.com',
      password: hashedPassword,
      token_rimanenti: 1000
    });

    userId1 = user1.id;
    userId2 = user2.id;

    // Genera token JWT
    const secret = process.env.JWT_SECRET || 'secret_key';
    authToken1 = jwt.sign({ id: userId1, email: user1.email }, secret, { expiresIn: '1h' });
    authToken2 = jwt.sign({ id: userId2, email: user2.email }, secret, { expiresIn: '1h' });

    // Crea un modello con il primo utente
    const model = await Modello.create({
      nome: 'Update Test Model',
      griglia: [
        [0, 1, 0],
        [0, 0, 0],
        [1, 0, 0]
      ],
      dimensioni_y: 3,
      dimensioni_x: 3,
      costo_creazione: 3 * 3 * 0.05,
      creatore_id: userId1
    });

    modelId = model.id;
  }, 30000); // Aumenta il timeout per beforeAll


  afterAll(async () => {
    // Pulisci dopo i test
    await CellaAggiornamento.destroy({ where: {} });
    await RichiestaAggiornamento.destroy({ where: {} });
    await Modello.destroy({ where: {} });
    await Utente.destroy({ where: {} });
  });

  describe('POST /api/updates/models/:id/request', () => {
    it('should create update request from different user', async () => {
      const requestData = {
        celle: [
          { x: 0, y: 0, nuovo_valore: 1 },
          { x: 2, y: 1, nuovo_valore: 1 }
        ]
      };

      const response = await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('messaggio');
      expect(response.body).toHaveProperty('richiesta_id');
      expect(response.body).toHaveProperty('stato', 'pending');
      expect(response.body).toHaveProperty('costo_token');
      expect(response.body).toHaveProperty('token_rimanenti');
    });

    it('should apply updates directly for model creator', async () => {
      const requestData = {
        celle: [
          { x: 2, y: 2, nuovo_valore: 1 }
        ]
      };

      const response = await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('messaggio');
      expect(response.body.messaggio).toContain('Aggiornamento applicato direttamente');
      expect(response.body).toHaveProperty('costo_token');
      expect(response.body).toHaveProperty('token_rimanenti');
    });

    it('should not create update with invalid coordinates', async () => {
      const requestData = {
        celle: [
          { x: 10, y: 10, nuovo_valore: 1 } // Coordinate fuori dalla griglia
        ]
      };

      const response = await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not create update without authentication', async () => {
      const updateData = {
        celle: [
          { x: 0, y: 0, nuovo_valore: 1 }
        ]
      };

      await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .send(updateData)
        .expect(401); // Unauthorized
    });

    it('should not create update with insufficient tokens', async () => {
      // Imposta i token dell'utente a un valore basso ma sufficiente per l'autenticazione
      await Utente.update(
        { token_rimanenti: 2 },
        { where: { id: userId2 } }
      );

      // Crea molti aggiornamenti per superare i token disponibili (costo: 9 * 0.35 = 3.15 > 2)
      const manyUpdates = [
        { x: 0, y: 0, nuovo_valore: 1 },
        { x: 0, y: 1, nuovo_valore: 1 },
        { x: 0, y: 2, nuovo_valore: 1 },
        { x: 1, y: 0, nuovo_valore: 1 },
        { x: 1, y: 1, nuovo_valore: 1 },
        { x: 1, y: 2, nuovo_valore: 1 },
        { x: 2, y: 0, nuovo_valore: 1 },
        { x: 2, y: 1, nuovo_valore: 1 },
        { x: 2, y: 2, nuovo_valore: 1 }
      ];

      const updateData = { celle: manyUpdates };

      const response = await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData)
        .expect(401); // Unauthorized - Token insufficienti

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Token insufficienti');
    });

    it('should only charge for cells that actually need updating', async () => {
      // Ripristina i token dell'utente per questo test
      await Utente.update(
        { token_rimanenti: 10 },
        { where: { id: userId2 } }
      );
      
      // Ottieni i token iniziali dell'utente
      const userBefore = await Utente.findByPk(userId2);
      const initialTokens = userBefore.token_rimanenti;

      // Invia una richiesta con 5 celle, ma solo 2 dovrebbero essere diverse
      const requestData = {
        celle: [
          { x: 0, y: 0, nuovo_valore: 0 }, // Stesso valore, non dovrebbe costare
          { x: 0, y: 1, nuovo_valore: 0 }, // Stesso valore, non dovrebbe costare
          { x: 0, y: 2, nuovo_valore: 0 }, // Stesso valore, non dovrebbe costare
          { x: 1, y: 0, nuovo_valore: 1 }, // Valore diverso, dovrebbe costare
          { x: 1, y: 1, nuovo_valore: 1 }  // Valore diverso, dovrebbe costare
        ]
      };

      const response = await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(requestData)
        .expect(201);

      // Verifica che il costo sia solo per 2 celle (2 * 0.35 = 0.7)
      const expectedCost = 2 * 0.35;
      expect(response.body.costo_token).toBeCloseTo(expectedCost, 2);
      
      // Verifica che i token siano stati detratti correttamente
      const userAfter = await Utente.findByPk(userId2);
      expect(parseFloat(userAfter.token_rimanenti)).toBeCloseTo(initialTokens - expectedCost, 2);
    });
  });

  describe('GET /api/updates/pending', () => {
    beforeEach(async () => {
      // Ripristina i token dell'utente
      await Utente.update(
        { token_rimanenti: 10 },
        { where: { id: userId2 } }
      );
      
      // Crea una richiesta di aggiornamento in sospeso
      await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ // Usa il formato corretto del body
          celle: [{ x: 0, y: 1, nuovo_valore: 1 }]
        });
    });

    it('should get pending requests for model creator', async () => {
      const response = await global.request
        .get('/api/updates/pending')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('richieste_pending');
      expect(Array.isArray(response.body.richieste_pending)).toBe(true);
      expect(response.body.richieste_pending.length).toBeGreaterThan(0);
      expect(response.body.richieste_pending[0]).toHaveProperty('stato', 'pending');
      expect(response.body.richieste_pending[0]).toHaveProperty('modello');
      expect(response.body.richieste_pending[0]).toHaveProperty('richiedente');
      expect(response.body.richieste_pending[0]).toHaveProperty('celle');
    });

    it('should return empty array for user without models', async () => {
      const response = await global.request
        .get('/api/updates/pending')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body).toHaveProperty('richieste_pending');
      expect(response.body.richieste_pending).toEqual([]);
    });

    it('should not get pending requests without authentication', async () => {
      await global.request
        .get('/api/updates/pending')
        .expect(401);
    });
  });

  describe('PUT /api/updates/approve-reject', () => {
    let requestId;

    beforeEach(async () => {
      // Ripristina i token dell'utente
      await Utente.update(
        { token_rimanenti: 10 },
        { where: { id: userId2 } }
      );
      
      // Crea una richiesta di aggiornamento per i test
      const updateResponse = await global.request
        .post(`/api/updates/models/${modelId}/request`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ // Usa il formato corretto del body
          celle: [{ x: 1, y: 2, nuovo_valore: 1 }]
        })
        .expect(201);
      
      // Aspetta un momento per assicurarsi che la richiesta sia stata salvata
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Ottieni l'ID della richiesta dalle richieste in sospeso
      const pendingResponse = await global.request
        .get('/api/updates/pending')
        .set('Authorization', `Bearer ${authToken1}`);
      
      if (pendingResponse.body.richieste_pending && pendingResponse.body.richieste_pending.length > 0) {
        requestId = pendingResponse.body.richieste_pending[0].id;
      } else {
        console.log('Pending response:', JSON.stringify(pendingResponse.body, null, 2));
        throw new Error('No pending requests found for test setup');
      }
    });

    it('should approve update request successfully', async () => {
      const approvalData = {
        richieste: [
          { id: requestId, azione: 'approve' }
        ]
      };

      const response = await global.request
        .put('/api/updates/approve-reject')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(approvalData)
        .expect(200);

      expect(response.body).toHaveProperty('messaggio');
      expect(response.body).toHaveProperty('risultati');
      expect(response.body.risultati[0]).toHaveProperty('richiesta_id', requestId);
      expect(response.body.risultati[0]).toHaveProperty('stato', 'approved');
    });

    it('should reject update request successfully', async () => {
      const rejectionData = {
        richieste: [
          { id: requestId, azione: 'reject' }
        ]
      };

      const response = await global.request
        .put('/api/updates/approve-reject')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body).toHaveProperty('messaggio');
      expect(response.body).toHaveProperty('risultati');
      expect(response.body.risultati[0]).toHaveProperty('richiesta_id', requestId);
      expect(response.body.risultati[0]).toHaveProperty('stato', 'rejected');
    });

    it('should not approve/reject without authentication', async () => {
      // Usa un ID fittizio se requestId non è disponibile
      const testRequestId = requestId || 999;
      const approvalData = {
        richieste: [
          { id: testRequestId, azione: 'approve' }
        ]
      };

      await global.request
        .put('/api/updates/approve-reject')
        .send(approvalData)
        .expect(401);
    });

    it('should not approve/reject request from different user', async () => {
      const approvalData = {
        richieste: [
          { id: requestId, azione: 'approve' }
        ]
      };

      const response = await global.request
        .put('/api/updates/approve-reject')
        .set('Authorization', `Bearer ${authToken2}`)
        .send(approvalData)
        .expect(200);

      expect(response.body).toHaveProperty('risultati');
      expect(response.body.risultati[0]).toHaveProperty('errore');
      expect(response.body.risultati[0].errore).toContain('Non autorizzato');
    });
  });

  describe('GET /api/updates/models/:id/history', () => {
    it('should get model update history', async () => {
      const response = await global.request
        .get(`/api/updates/models/${modelId}/history`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('aggiornamenti');
      expect(Array.isArray(response.body.aggiornamenti)).toBe(true);
      expect(response.body).toHaveProperty('totale');
      expect(response.body).toHaveProperty('modello_id', modelId);
      expect(response.body).toHaveProperty('filtri_applicati');
    });

    it('should filter history by status', async () => {
      const response = await global.request
        .get(`/api/updates/models/${modelId}/history?stato=pending`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('aggiornamenti');
      expect(response.body).toHaveProperty('filtri_applicati');
      expect(response.body.filtri_applicati.stato).toBe('pending');
      // Verifica che tutte le richieste abbiano lo stato richiesto
      response.body.aggiornamenti.forEach(richiesta => {
        expect(richiesta.stato).toBe('pending');
      });
    });

    it('should filter history by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await global.request
        .get(`/api/updates/models/${modelId}/history?data_inizio=${today}&data_fine=${tomorrow}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('aggiornamenti');
      expect(response.body).toHaveProperty('filtri_applicati');
      expect(response.body.filtri_applicati.data_inizio).toBe(today);
      expect(response.body.filtri_applicati.data_fine).toBe(tomorrow);
    });

    it('should filter history by start date only', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await global.request
        .get(`/api/updates/models/${modelId}/history?data_inizio=${yesterday}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toHaveProperty('aggiornamenti');
      expect(response.body).toHaveProperty('filtri_applicati');
      expect(response.body.filtri_applicati.data_inizio).toBe(yesterday);
      expect(response.body.filtri_applicati.data_fine).toBe(null);
    });

    it('should not get history without authentication', async () => {
      await global.request
        .get(`/api/updates/models/${modelId}/history`)
        .expect(401);
    });
  });
});