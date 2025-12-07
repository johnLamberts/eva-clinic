// src/scripts/migrate.ts
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import DatabaseConnection from '../orm/connection.orm';
import logger from '../utils/logger.utils';

dotenv.config();

async function runMigrations() {
  try {
    logger.info('🔄 Starting database migration...');

    // 1. Initialize DB Connection
    DatabaseConnection.initialize({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dental_clinic_mis', // Ensure this matches
      multipleStatements: true, // IMPORTANT: Allows executing the whole file at once
    });

    // 2. Read the SQL file
    // Adjust the path to match where your SQL file is located
    const sqlPath = path.join(__dirname, '../../databases/001_authentication_user_mgm.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file not found at: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 3. Execute the SQL
    const connection = await DatabaseConnection.getConnection();
    
    // We use query() because execute() sometimes has issues with multiple statements depending on the driver version
    await connection.query(sql);
    
    connection.release();

    logger.info('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await DatabaseConnection.close();
  }
}

runMigrations();
