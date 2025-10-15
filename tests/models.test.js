const { Utente, Modello } = require('../src/models');

describe('Models API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Pulisci il database prima dei test
    await Modello.destroy({ where: {} });
    await Utente.destroy({ where: {} });

    // Crea un utente per i test
    const registerResponse = await global.request
      .post('/api/auth/register')
      .send({
        email: 'modeltest@example.com',
        password: 'password123'
      });

    // Effettua il login per ottenere il token
    const loginResponse = await global.request
      .post('/api/auth/login')
      .send({
        email: 'modeltest@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    // Pulisci dopo i test
    await Modello.destroy({ where: {} });
    await Utente.destroy({ where: {} });
  });

  describe('POST /api/models', () => {
    it('should create a new model successfully', async () => {
      const modelData = {
        nome: 'Test Model',
        griglia: [
          [0, 1, 0],
          [0, 0, 0],
          [1, 0, 0]
        ]
      };

      const response = await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(201); // Il controller usa dimensioni_y e dimensioni_x

      expect(response.body).toHaveProperty('message', 'Modello creato con successo');
      expect(response.body).toHaveProperty('modello');
      expect(response.body.modello).toHaveProperty('nome', modelData.nome);
      expect(response.body.modello).toHaveProperty('creatore_id', userId);
      expect(response.body).toHaveProperty('costo_creazione');
      expect(response.body).toHaveProperty('token_rimanenti');
    });

    it('should not create model without authentication', async () => {
      const modelData = {
        nome: 'Test Model',
        griglia: [[0, 1], [1, 0]]
      };

      await global.request
        .post('/api/models')
        .send(modelData)
        .expect(401);
    });

    it('should not create model with insufficient tokens', async () => {
      // Crea un modello molto grande per esaurire i token
      const largeGrid = Array(20).fill().map(() => Array(20).fill(0));
      
      const modelData = {
        nome: 'Large Model',
        griglia: largeGrid
      };

      const response = await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('Token insufficienti');
    });

    it('should not create model with invalid grid dimensions', async () => {
      const modelData = {
        nome: 'Invalid Model',
        griglia: [
          [0, 1, 0],
          [0, 0] // Riga con numero diverso di colonne
        ]
      };

      const response = await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modelData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/models', () => {
    beforeEach(async () => {
      // Crea un modello per i test
      await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Test Model for GET',
          griglia: [[0, 1], [1, 0]]
        });
    });

    it('should get user models successfully', async () => {
      const response = await global.request
        .get('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('modelli');
      expect(Array.isArray(response.body.modelli)).toBe(true);
      expect(response.body.modelli.length).toBeGreaterThan(0);
      expect(response.body.modelli[0]).toHaveProperty('nome');
      expect(response.body.modelli[0]).toHaveProperty('id');
    });

    it('should not get models without authentication', async () => {
      await global.request
        .get('/api/models')
        .expect(401);
    });
  });

  describe('POST /api/models/:id/execute', () => {
    let modelId;

    beforeEach(async () => {
      // Crea un modello per i test di esecuzione
      const response = await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Execution Test Model',
          griglia: [
            [0, 0, 0],
            [1, 0, 1],
            [0, 0, 0]
          ]
        });
      
      modelId = response.body.modello.id;
    });

    it('should execute pathfinding successfully', async () => {
      const executionData = {
        startX: 0,
        startY: 0,
        goalX: 2,
        goalY: 2
      };

      const response = await global.request
        .post(`/api/models/${modelId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(executionData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('percorso');
      expect(response.body).toHaveProperty('costo_token');
      expect(response.body).toHaveProperty('token_rimanenti');
      expect(Array.isArray(response.body.percorso)).toBe(true);
    });

    it('should not execute with invalid coordinates', async () => {
      const executionData = {
        startX: -1,
        startY: 0,
        goalX: 2,
        goalY: 2
      };

      const response = await global.request
        .post(`/api/models/${modelId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(executionData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not execute without authentication', async () => {
      const executionData = {
        startX: 0,
        startY: 0,
        goalX: 2,
        goalY: 2
      };

      await global.request
        .post(`/api/models/${modelId}/execute`)
        .send(executionData)
        .expect(401);
    });
  });

  describe('GET /api/models/:id/status', () => {
    let modelId;

    beforeEach(async () => {
      const response = await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Status Test Model',
          griglia: [[0, 1], [1, 0]]
        });
      
      modelId = response.body.modello.id;
    });

    it('should get model status successfully', async () => {
      const response = await global.request
        .get(`/api/models/${modelId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('modello_id', modelId);
      expect(response.body).toHaveProperty('ha_richieste_pending');
      expect(response.body).toHaveProperty('numero_richieste_pending');
    });

    it('should not get status without authentication', async () => {
      await global.request
        .get(`/api/models/${modelId}/status`)
        .expect(401);
    });
  });
});