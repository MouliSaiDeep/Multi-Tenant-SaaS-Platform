const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const runMigrations = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting migrations...');
        const migrationsDir = path.join(__dirname, '../../migrations');
        const files = fs.readdirSync(migrationsDir).sort(); // Ensure order (001, 002...)

        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                console.log(`Executing: ${file}`);
                await client.query(sql);
            }
        }
        console.log('All migrations executed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

runMigrations();