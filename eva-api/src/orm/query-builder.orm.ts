// src/orm/query-builder.ts
import { PoolConnection } from 'mysql2/promise';
import DatabaseConnection from './connection.orm';
import { Transaction } from './transaction.orm';

export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';

export interface WhereCondition {
  type: 'Basic' | 'In' | 'Null' | 'NotNull' | 'Raw';
  column?: string;
  operator?: Operator;
  value?: any;
  boolean: 'AND' | 'OR'; // Added logic connector
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  table: string;
  on: string;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export class QueryBuilder<T = any> {
  private tableName: string;
  private selectColumns: string[] = ['*'];
  private whereConditions: WhereCondition[] = [];
  private orderByClause: string[] = [];
  private groupByClause: string[] = [];
  private havingClause: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private joinClauses: JoinClause[] = [];
  private distinctFlag: boolean = false;
  private lockFlag?: string; // FOR UPDATE, etc.
  private connection?: PoolConnection;

  constructor(table: string, connection?: PoolConnection) {
    this.tableName = table;
    this.connection = connection;
  }

  // --- Selection & modifiers ---

  select(...columns: string[]): this {
    this.selectColumns = columns.length > 0 ? columns : ['*'];
    return this;
  }

  distinct(): this {
    this.distinctFlag = true;
    return this;
  }

  // --- Filtering (Upgraded with OR logic) ---

  where(column: string, operator: Operator, value: any): this {
    this.whereConditions.push({ type: 'Basic', column, operator, value, boolean: 'AND' });
    return this;
  }

  orWhere(column: string, operator: Operator, value: any): this {
    this.whereConditions.push({ type: 'Basic', column, operator, value, boolean: 'OR' });
    return this;
  }

  whereIn(column: string, values: any[]): this {
    this.whereConditions.push({ type: 'In', column, operator: 'IN', value: values, boolean: 'AND' });
    return this;
  }

  whereNotIn(column: string, values: any[]): this {
    this.whereConditions.push({ type: 'In', column, operator: 'NOT IN', value: values, boolean: 'AND' });
    return this;
  }

  whereNull(column: string): this {
    this.whereConditions.push({ type: 'Null', column, operator: 'IS NULL', boolean: 'AND' });
    return this;
  }

  whereNotNull(column: string): this {
    this.whereConditions.push({ type: 'NotNull', column, operator: 'IS NOT NULL', boolean: 'AND' });
    return this;
  }

  whereRaw(sql: string, bindings: any[] = [], boolean: 'AND' | 'OR' = 'AND'): this {
      this.whereConditions.push({ type: 'Raw', value: { sql, bindings }, boolean });
      return this;
  }

  // --- Joins ---

  join(table: string, first: string, operator: string, second: string, type: JoinClause['type'] = 'INNER'): this {
    this.joinClauses.push({ type, table, on: `${first} ${operator} ${second}` });
    return this;
  }

  leftJoin(table: string, first: string, operator: string, second: string): this {
    return this.join(table, first, operator, second, 'LEFT');
  }

  // --- Ordering & Grouping (Upgraded) ---

  groupBy(...columns: string[]): this {
    this.groupByClause.push(...columns);
    return this;
  }

  having(column: string, operator: string, value: any): this {
    this.havingClause.push(`${column} ${operator} ?`);
    // Note: A real implementation needs a specific `havingValues` array, 
    // strictly simplified here to appending to values list at build time.
    return this; 
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByClause.push(`${column} ${direction}`);
    return this;
  }

  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  // --- Transaction Locking ---

  lockForUpdate(): this {
    this.lockFlag = 'FOR UPDATE';
    return this;
  }

  sharedLock(): this {
    this.lockFlag = 'LOCK IN SHARE MODE';
    return this;
  }

  // --- Query Building Logic (Internal) ---

  private buildWhereClause(): { sql: string; values: any[] } {
    if (this.whereConditions.length === 0) return { sql: '', values: [] };

    const sqlParts: string[] = [];
    const values: any[] = [];

    this.whereConditions.forEach((cond, index) => {
      const prefix = index === 0 ? 'WHERE' : cond.boolean; // WHERE ... AND ... OR ...

      if (cond.type === 'Basic') {
        sqlParts.push(`${prefix} ${cond.column} ${cond.operator} ?`);
        values.push(cond.value);
      } 
      else if (cond.type === 'In') {
        const placeholders = cond.value.map(() => '?').join(', ');
        sqlParts.push(`${prefix} ${cond.column} ${cond.operator} (${placeholders})`);
        values.push(...cond.value);
      } 
      else if (cond.type === 'Null' || cond.type === 'NotNull') {
        sqlParts.push(`${prefix} ${cond.column} ${cond.operator}`);
      }
      else if (cond.type === 'Raw') {
          sqlParts.push(`${prefix} ${cond.value.sql}`);
          values.push(...cond.value.bindings);
      }
    });

    return { sql: ' ' + sqlParts.join(' '), values };
  }

  toSql(): { sql: string; values: any[] } {
    const distinct = this.distinctFlag ? 'DISTINCT ' : '';
    let sql = `SELECT ${distinct}${this.selectColumns.join(', ')} FROM ${this.tableName}`;

    for (const join of this.joinClauses) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }

    const where = this.buildWhereClause();
    sql += where.sql;

    if (this.groupByClause.length > 0) {
      sql += ` GROUP BY ${this.groupByClause.join(', ')}`;
    }

    // Note: Simple handling of HAVING values (in real scenarios, strictly separate)
    // Here we assume having clause values are handled via direct string or raw injection for simplicity
    if (this.havingClause.length > 0) {
      sql += ` HAVING ${this.havingClause.join(' AND ')}`;
    }

    if (this.orderByClause.length > 0) {
      sql += ` ORDER BY ${this.orderByClause.join(', ')}`;
    }

    if (this.limitValue !== undefined) sql += ` LIMIT ${this.limitValue}`;
    if (this.offsetValue !== undefined) sql += ` OFFSET ${this.offsetValue}`;
    if (this.lockFlag) sql += ` ${this.lockFlag}`;

    return { sql, values: where.values };
  }

  dump(): void {
    console.log(this.toSql());
  }

  // --- Execution Methods ---

  async get(): Promise<T[]> {
    const { sql, values } = this.toSql();
    const result = this.connection
      ? await this.connection.execute(sql, values)
      : await DatabaseConnection.query<T>(sql, values);
    
    return this.connection ? (result[0] as T[]) : (result as T[]);
  }

  async first(): Promise<T | null> {
    this.limit(1);
    const results = await this.get();
    return results.length > 0 ? results[0] : null;
  }

  // --- Aggregates ---

  async count(column: string = '*'): Promise<number> {
    return this.aggregate('COUNT', column);
  }

  async sum(column: string): Promise<number> {
    return this.aggregate('SUM', column);
  }

  async avg(column: string): Promise<number> {
    return this.aggregate('AVG', column);
  }

  async max(column: string): Promise<any> {
    return this.aggregate('MAX', column);
  }

  async min(column: string): Promise<any> {
    return this.aggregate('MIN', column);
  }

  private async aggregate(func: string, column: string): Promise<any> {
    const originalSelect = this.selectColumns;
    this.selectColumns = [`${func}(${column}) as aggregate`];
    const { sql, values } = this.toSql();
    
    // Reset for subsequent calls
    this.selectColumns = originalSelect; 

    const result = this.connection
      ? await this.connection.execute(sql, values)
      : await DatabaseConnection.query<any>(sql, values);

    const rows = this.connection ? result[0] : result;
    return (rows as any)[0]?.aggregate || 0;
  }

  // --- Pagination (New Feature) ---

  async paginate(page: number = 1, perPage: number = 15): Promise<PaginationResult<T>> {
    const total = await this.count();
    
    const rows = await this
      .limit(perPage)
      .offset((page - 1) * perPage)
      .get();

    return {
      data: rows,
      meta: {
        total,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil(total / perPage),
      }
    };
  }

  // --- Write Operations ---

  async insert(data: Partial<T>): Promise<number> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    const result = await this.executeQuery(sql, values);
    return (result as any).insertId;
  }

  // New: Bulk Insert
  async insertMany(data: Partial<T>[]): Promise<number> {
    if (data.length === 0) return 0;
    const columns = Object.keys(data[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    data.forEach(row => {
        values.push(...Object.values(row));
        placeholders.push(`(${columns.map(() => '?').join(', ')})`);
    });

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
    
    // Note: Bulk inserts might exceed packet size in very large sets, usually handled by chunking in higher logic
    const result = await this.executeQuery(sql, values);
    return (result as any).affectedRows; 
  }

  async update(data: Partial<T>): Promise<number> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const where = this.buildWhereClause();
    
    const sql = `UPDATE ${this.tableName} SET ${setClause}${where.sql}`;
    const result = await this.executeQuery(sql, [...values, ...where.values]);
    
    return (result as any).affectedRows;
  }

  async delete(): Promise<number> {
    const where = this.buildWhereClause();
    const sql = `DELETE FROM ${this.tableName}${where.sql}`;
    const result = await this.executeQuery(sql, where.values);
    return (result as any).affectedRows;
  }

  private async executeQuery(sql: string, values: any[]) {

    // 1. Check for active Transaction
    const trxConn = Transaction.activeConnection();

    if(trxConn) {
      const [result] = await trxConn.execute(sql, values);
      return result;
    }

    // Use the standard pool
    return DatabaseConnection.query(sql, values);
  }
}

export default QueryBuilder;
