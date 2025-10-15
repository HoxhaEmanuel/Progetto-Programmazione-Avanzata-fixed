const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Utente, Modello, RichiestaAggiornamento } = require('../src/models');

describe('Admin API', () => {
  jest.setTimeout(30000); // Aumenta il timeout per questo file di test

  let adminToken, userToken;
  let adminId, userId;

  beforeAll(async () => {
    // Pulisci il database prima dei test
    await RichiestaAggiornamento.destroy({ where: {} });
    await Modello.destroy({ where: {} });
    await Utente.destroy({ where: {} });

    // Crea utenti direttamente nel DB per velocità e affidabilità
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await Utente.create({
      email: 'admin@example.com',
      password: hashedPassword,
      ruolo: 'admin',
      token_rimanenti: 1000
    });
    const normalUser = await Utente.create({
      email: 'user@example.com',
      password: hashedPassword,
      token_rimanenti: 50
    });

    // Assicuriamoci che i ruoli siano corretti nel database
    await adminUser.update({ ruolo: 'admin' });
    await normalUser.update({ ruolo: 'user' });
    
    const secret = process.env.JWT_SECRET || 'your_very_long_and_secure_jwt_secret_key';
    adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, ruolo: 'admin' }, secret, { expiresIn: '1h' });
    userToken = jwt.sign({ id: normalUser.id, email: normalUser.email, ruolo: 'user' }, secret, { expiresIn: '1h' });
    adminId = adminUser.id;
    userId = normalUser.id;
  });

  afterAll(async () => {
    // Pulisci dopo i test
    await RichiestaAggiornamento.destroy({ where: {} });
    await Modello.destroy({ where: {} });
    await Utente.destroy({ where: {} });
  });

  describe('POST /api/admin/recharge', () => {
    it('should recharge user tokens successfully', async () => {
      const rechargeData = {
        email: 'user@example.com',
        nuovoSaldo: 100.00
      };

      const response = await global.request
        .post('/api/admin/recharge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rechargeData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Saldo aggiornato con successo');
      expect(response.body).toHaveProperty('utente');
      expect(response.body.utente).toHaveProperty('email', rechargeData.email);
      expect(response.body.utente).toHaveProperty('token_rimanenti', rechargeData.nuovoSaldo);
    });

    it('should not recharge with invalid email', async () => {
      const rechargeData = {
        email: 'nonexistent@example.com',
        nuovoSaldo: 100.00
      };

      const response = await global.request
        .post('/api/admin/recharge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rechargeData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', `Utente con email ${rechargeData.email} non trovato`);
    });

    it('should not recharge with negative balance', async () => {
      const rechargeData = {
        email: 'user@example.com',
        nuovoSaldo: -10.00
      };

      const response = await global.request
        .post('/api/admin/recharge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rechargeData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Il campo nuovoSaldo deve essere un numero non negativo');
    });

    it('should not recharge without admin privileges', async () => {
      // Assicuriamoci che l'utente normale non sia admin
      const userCheck = await Utente.findOne({ where: { email: 'user@example.com' } });
      if (userCheck && userCheck.ruolo === 'admin') {
        await userCheck.update({ ruolo: 'user' });
      }
      
      const rechargeData = {
        email: 'user@example.com',
        nuovoSaldo: 100.00
      };

      const response = await global.request
        .post('/api/admin/recharge')
        .set('Authorization', `Bearer ${userToken}`)
        .send(rechargeData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Accesso negato: privilegi di amministratore richiesti');
    });

    it('should not recharge without authentication', async () => {
      const rechargeData = {
        email: 'user@example.com',
        nuovoSaldo: 100.00
      };

      await global.request
        .post('/api/admin/recharge')
        .send(rechargeData)
        .expect(401);
    });

    it('should not recharge with missing fields', async () => {
      const response = await global.request
        .post('/api/admin/recharge')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'user@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/stats', () => {
    beforeEach(async () => {
      // Crea alcuni dati per le statistiche
      await global.request
        .post('/api/models')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nome: 'Stats Test Model',
          griglia: [[0, 1], [1, 0]],
          dimensioni_y: 2,
          dimensioni_x: 2,
          costo_creazione: 2 * 2 * 0.05
        });
    });

    it('should get system statistics successfully', async () => {
      const response = await global.request
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('utenti');
      expect(response.body.utenti).toHaveProperty('totale');
      expect(response.body).toHaveProperty('modelli');
      expect(response.body).toHaveProperty('richieste_aggiornamento');
      expect(response.body).toHaveProperty('economia');
      
      expect(response.body.richieste_aggiornamento).toHaveProperty('pending');
      expect(response.body.richieste_aggiornamento).toHaveProperty('approved');
      expect(response.body.richieste_aggiornamento).toHaveProperty('rejected');
      
      expect(typeof response.body.utenti.totale).toBe('number');
      expect(typeof response.body.modelli.totale).toBe('number');
      expect(typeof response.body.economia.token_totali_sistema).toBe('number');
    });

    it('should not get stats without admin privileges', async () => {
      // Assicuriamoci che l'utente normale non sia admin
      const userCheck = await Utente.findOne({ where: { email: 'user@example.com' } });
      if (userCheck && userCheck.ruolo === 'admin') {
        await userCheck.update({ ruolo: 'user' });
      }
      
      const response = await global.request
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Accesso negato: privilegi di amministratore richiesti');
    });

    it('should not get stats without authentication', async () => {
      await global.request
        .get('/api/admin/stats')
        .expect(401);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users successfully', async () => {
      const response = await global.request
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('utenti');
      expect(response.body).toHaveProperty('paginazione');
      
      expect(Array.isArray(response.body.utenti)).toBe(true);
      expect(response.body.utenti.length).toBeGreaterThan(0);
      
      // Verifica che ogni utente abbia i campi necessari
      response.body.utenti.forEach(utente => {
        expect(utente).toHaveProperty('id');
        expect(utente).toHaveProperty('email');
        expect(utente).toHaveProperty('ruolo');
        expect(utente).toHaveProperty('token_rimanenti');
        expect(utente).toHaveProperty('createdAt');
        expect(utente).not.toHaveProperty('password'); // Non deve esporre la password
      });
    });

    it('should support pagination', async () => {
      const response = await global.request
        .get('/api/admin/users?pagina=1&limite=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('utenti');
      expect(response.body.utenti.length).toBeLessThanOrEqual(1);
      expect(response.body.paginazione).toHaveProperty('pagina_corrente', 1);
      expect(response.body.paginazione).toHaveProperty('elementi_per_pagina', 1);
    });

    it('should not get users without admin privileges', async () => {
      // Prima verifichiamo che l'utente normale non sia admin
      const userCheck = await Utente.findOne({ where: { email: 'user@example.com' } });
      if (userCheck && userCheck.ruolo === 'admin') {
        await userCheck.update({ ruolo: 'user' });
      }
      
      const response = await global.request
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Accesso negato: privilegi di amministratore richiesti');
    });

    it('should not get users without authentication', async () => {
      await global.request
        .get('/api/admin/users')
        .expect(401);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await global.request
        .get('/api/admin/users?pagina=-1&limite=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      // Dovrebbe usare valori di default
      expect(response.body).toHaveProperty('error');
    });
  });
});