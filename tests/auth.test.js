const { Utente } = require('../src/models');
const initTestSchema = require('./initTestSchema');

describe('Authentication API', () => {
  beforeAll(async () => {
    // Reinizializza lo schema del database per garantire i valori di default
    await initTestSchema();
  });

  afterAll(async () => {
    // Pulisci dopo i test
    await Utente.destroy({ where: {} });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Pulisci prima di questo test specifico
      await Utente.destroy({ where: { email: 'test@example.com' } });
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await global.request
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Utente registrato con successo');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('ruolo');
      expect(response.body.user).toHaveProperty('token_rimanenti', '20.00');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await global.request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await global.request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should not register user with short password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123'
      };

      const response = await global.request
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crea un utente per i test di login
      await global.request
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
    });

    afterEach(async () => {
      // Pulisci dopo ogni test
      await Utente.destroy({ where: { email: 'login@example.com' } });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await global.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login effettuato con successo');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', loginData.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await global.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Email o password non validi');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await global.request
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Email o password non validi');
    });

    it('should not login with missing fields', async () => {
      const response = await global.request
        .post('/api/auth/login')
        .send({ email: 'login@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});