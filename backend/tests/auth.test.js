const request = require('supertest');
const app = require('../server'); 
const db = require('../src/config/db');

const randomId = Math.floor(Math.random() * 10000);
const testTenant = {
    tenantName: `Test Corp ${randomId}`,
    subdomain: `test${randomId}`,
    adminEmail: `admin${randomId}@test.com`,
    adminPassword: 'Password123!',
    adminFullName: 'Test Admin'
};

describe('Auth Endpoints', () => {

    beforeAll(async () => {
    });

    afterAll(async () => {
        await db.end(); 
    });

    it('should register a new tenant', async () => {
        const res = await request(app)
            .post('/api/auth/register-tenant')
            .send(testTenant);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);
        
        expect(res.body).toHaveProperty('message', 'Registration successful');
    });

    it('should login with the new admin credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testTenant.adminEmail,
                password: testTenant.adminPassword,
                subdomain: testTenant.subdomain
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('token');

        process.env.TEST_TOKEN = res.body.data.token;
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testTenant.adminEmail,
                password: 'WrongPassword',
                subdomain: testTenant.subdomain
            });

        expect(res.statusCode).toEqual(401);
    });
});