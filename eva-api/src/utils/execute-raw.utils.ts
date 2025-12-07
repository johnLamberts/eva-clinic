import BaseRepository from "~/orm/base-repository.orm";
import DatabaseConnection from "~/orm/connection.orm";

// Helper for raw queries to ensure transaction safety
async function executeRaw<T>(repo: BaseRepository<any>, sql: string, params: any[]): Promise<T[]> {
  const conn = repo['connection'];

  if(conn) {
    const [rows] = await conn.execute(sql, params);
    return rows as T[];
  }

  return DatabaseConnection.query<T>(sql, params);
}

export default executeRaw;
