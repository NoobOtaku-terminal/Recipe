#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MIGRATIONS_DIR = '/migrations';
const SEEDS_DIR = '/seeds';

async function runMigrations() {
    const client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        // Create migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Get list of already executed migrations
        const { rows: executedMigrations } = await client.query(
            'SELECT filename FROM schema_migrations ORDER BY id'
        );
        const executedSet = new Set(executedMigrations.map(m => m.filename));

        // Read migration files
        const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`\n📋 Found ${migrationFiles.length} migration file(s)`);

        // Run pending migrations
        for (const file of migrationFiles) {
            if (executedSet.has(file)) {
                console.log(`⏭️  Skipping ${file} (already executed)`);
                continue;
            }

            console.log(`\n🔄 Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                console.log(`✅ Migration ${file} completed successfully`);
            } catch (error) {
                console.error(`❌ Migration ${file} failed:`, error.message);
                throw error;
            }
        }

        // Run seed data in development if database is empty
        if (NODE_ENV === 'development' && process.env.SEED_DATABASE !== 'false') {
            // Check if database already has data (check users table)
            try {
                const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
                const userCount = parseInt(rows[0].count);

                if (userCount === 0) {
                    console.log('\n🌱 Database is empty, running seed data...');

                    const seedFiles = fs.readdirSync(SEEDS_DIR)
                        .filter(f => f.endsWith('.sql'))
                        .sort();

                    for (const file of seedFiles) {
                        console.log(`🌱 Seeding: ${file}`);
                        const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');

                        try {
                            await client.query(sql);
                            console.log(`✅ Seed ${file} completed successfully`);
                        } catch (error) {
                            console.error(`⚠️  Seed ${file} failed (non-fatal):`, error.message);
                            // Seeds are non-fatal, continue
                        }
                    }
                } else {
                    console.log(`\n⏭️  Skipping seed data (database already has ${userCount} users)`);
                }
            } catch (error) {
                console.log('\n⏭️  Skipping seed data (users table not ready yet)');
            }
        } else {
            console.log('\n⏭️  Skipping seed data (production mode or disabled)');
        }

        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

// Run migrations
runMigrations();
