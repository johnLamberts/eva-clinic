import { AsyncLocalStorage } from "async_hooks";
import { PoolConnection } from "mysql2/promise";
import DatabaseConnection from "./connection.orm";

export enum IsolationLevel {
  READ_UNCOMMITTED = "READ UNCOMMITTED",
  READ_COMMITTED = 'READ COMMITTED', 
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE'
}

export interface TxOptions {
  isolation?: IsolationLevel;
  retries?: number; // Automatic Deadlock handling
}

// Context store : Holds connection every request
const txContext = new AsyncLocalStorage<PoolConnection>();

export class Transaction {
  /**
   * The main entry point
   * ACID - Compliant transaction with Nesting Support
   */
  static async transaction<T>(
    callback: () => Promise<T>,
    options: TxOptions = {}
  ): Promise<T> {
    const existingConn = txContext.getStore();

    // A. NESTED TRANSACTION (Use Savepoints)
    // This allows Service B to fail without killing Service A's transaction
    if (existingConn) {
      const savepointId = `SP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      try {
        await existingConn.query(`SAVEPOINT ${savepointId}`);
        const result = await callback();
        await existingConn.query(`RELEASE SAVEPOINT ${savepointId}`); // Cleanup
        return result;
      } catch (err) {
        await existingConn.query(`ROLLBACK TO SAVEPOINT ${savepointId}`); // Rollback only this part
        throw err; // Re-throw so caller knows it failed
      }
    }

    // B. ROOT TRANSACTION (New Connection)
    // Default to 3 retries for robustness (Enterprise standard)
    const retries = options.retries ?? 3; 
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt++;
      const conn = await DatabaseConnection.getConnection();

      try {
        // 1. Configure Isolation
        if (options.isolation) {
          await conn.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolation}`);
        }

        // 2. Begin
        await conn.beginTransaction();

        // 3. Run callback (injecting connection into context)
        const result = await txContext.run(conn, callback);

        // 4. Commit 
        await conn.commit();
        return result;
        
      } catch (err: any) {
        await conn.rollback();

        // Deadlock retry logic
        // MySQL Error 1213 = Deadlock found when trying to get lock
        if (err.code === 'ER_LOCK_DEADLOCK' && attempt <= retries) {
          console.warn(`Deadlock detected. Retrying... (${attempt}/${retries})`);
          // Exponential Backoff: Wait longer for each retry (50ms, 100ms, 200ms...)
          await new Promise(r => setTimeout(r, attempt * 50)); 
          continue;
        }

        throw err;
      } finally {
        conn.release();
      }
    }
  }

  /**
   * Helper for repositories to get the current connection
   */
  static activeConnection(): PoolConnection | undefined {
    return txContext.getStore();
  }
}
