import mysql from "mysql2/promise";
interface IDatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  queueLimit?: number;
  multipleStatements: boolean;
}

class DatabaseConnection {
  private static _pool: mysql.Pool | null = null;

  static initialize(config: IDatabaseConfig) {
    if(this._pool) {
      throw new Error('Database pool already initialized')
    }

     this._pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: config.queueLimit || 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      multipleStatements: true
    });

    console.log('✓ Database connection pool initialized');
  }

  static getPool(): mysql.Pool {
    if (!this._pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    return this._pool;
  }

  static async getConnection(): Promise<mysql.PoolConnection> {
    const pool = this.getPool();
    return pool.getConnection();
  }

  static async query<T = any>(sql: string, values?: any[]): Promise<T[]> {
    const pool = this.getPool();
    const [rows] = await pool.execute(sql, values);
    return rows as T[];
  }

  static async close(): Promise<void> {
    if (this._pool) {
      await this._pool.end();
      this._pool = null;
      console.log('✓ Database connection pool closed');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const pool = this.getPool();
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}


export default DatabaseConnection;
