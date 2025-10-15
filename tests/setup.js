const request = require('supertest');
const app = require('../src/app').default;
const { sequelize } = require('../src/models');
const createTestDb = require('./createTestDb');
const initTestSchema = require('./initTestSchema');

global.request = request(app);

beforeAll(async () => {
  await createTestDb();
  // Usa lo schema SQL invece di sync({ force: true })
  // per garantire che i default values DECIMAL siano applicati correttamente
  await initTestSchema();
});

afterAll(async () => {
  await sequelize.close();
});
