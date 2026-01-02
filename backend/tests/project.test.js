const request = require('supertest');
const app = require('../server');
const db = require('../src/config/db');

const randomId = Math.floor(Math.random() * 10000);
const projectUser = {
    tenantName: `Project Corp ${randomId}`,
    subdomain: `project${randomId}`,
    adminEmail: `proj${randomId}@test.com`,
    adminPassword: 'Password123!',
    adminFullName: 'Project Manager'
};

let token = '';
let projectId = '';

describe('Project Endpoints', () => {

    beforeAll(async () => {
        // 1. Register
        await request(app).post('/api/auth/register-tenant').send(projectUser);

        // 2. Login to get Token
        const res = await request(app).post('/api/auth/login').send({
            email: projectUser.adminEmail,
            password: projectUser.adminPassword,
            subdomain: projectUser.subdomain
        });
        token = res.body.data.token;
    });

    afterAll(async () => {
        await db.end();
    });

    it('should create a new project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Unit Test Project',
                description: 'Testing the API',
                status: 'active'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toEqual('Unit Test Project');

        projectId = res.body.data.id;
    });

    it('should get all projects for the tenant', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);

        const project = res.body.data.find(p => p.id === projectId);
        expect(project).toBeDefined();
    });

    it('should fail to create project without auth token', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({
                name: 'Hacker Project',
                status: 'active'
            });

        expect(res.statusCode).toEqual(401);
    });
});