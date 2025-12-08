// src/orm/base-repository.ts
import { PoolConnection } from 'mysql2/promise';
import QueryBuilder from './query-builder.orm';

// Flexible entity type
export interface BaseEntity {
  id?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  deleted_at?: string | Date | null;
  [key: string]: any; // Allow loose typing for other columns
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// Hooks interface to be overridden by child classes
export interface RepositoryHooks<T> {
  beforeCreate?(data: Partial<T>): Promise<Partial<T>>;
  afterCreate?(data: T): Promise<void>;
  beforeUpdate?(id: number, data: Partial<T>): Promise<Partial<T>>;
  afterUpdate?(id: number, data: Partial<T>): Promise<void>;
}

export abstract class BaseRepository<T extends BaseEntity> implements RepositoryHooks<T> {
  protected abstract tableName: string;
  
  // Connection is readonly to enforce using withTransaction() for mutations
  protected readonly connection?: PoolConnection;

  // Set this to 'false' in repositories like AuditLogs or LoginAttempts
  protected useTimestamps = true; 
  
  // Set this to 'false' if a table does not support Soft Deletes
  protected useSoftDeletes = true;

  constructor(connection?: PoolConnection) {
    this.connection = connection;
  }

  protected newQuery(): QueryBuilder<T> {
    return new QueryBuilder<T>(this.tableName, this.connection);
  }

  private cleanForDb(data: any): any {
    const clean: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // MAGIC LINE: If value is undefined, force it to NULL.
        // Otherwise, keep it as is (including 0, false, empty string)
        clean[key] = data[key] === undefined ? null : data[key];
      }
    }
    return clean;
  }

  /**
   * Returns a new instance of the repository bound to a specific transaction.
   * This ensures thread safety in concurrent environments.
   */
  public withTransaction(connection: PoolConnection): this {
    // This creates a new instance of the Child Class (e.g., UserRepository)
    // passing the connection to the constructor.
    const Constructor = this.constructor as new (conn: PoolConnection) => this;
    return new Constructor(connection);
  }


  // --- Scopes (Default Filters) ---

  protected applyScopes(query: QueryBuilder<T>): QueryBuilder<T> {
    // Override this in child classes to apply default filters
    // e.g., query.where('is_active', '=', 1);
    return query;
  }

  // --- Read Operations ---

  async findById(id: number, includeDeleted = false): Promise<T | null> {
    const query = this.newQuery().where('id', '=', id);
    if (!includeDeleted) query.whereNull('deleted_at');
    return query.first();
  }

  /**
   * Finds a record or throws an error if not found.
   * Useful for API controllers.
   */
  async findOrFail(id: number, includeDeleted = false): Promise<T> {
    const item = await this.findById(id, includeDeleted);
    if (!item) throw new Error(`${this.tableName} record with ID ${id} not found.`);
    return item;
  }

  /**
   * Find by generic criteria object.
   * Usage: repo.findOneBy({ email: 'test@test.com', status: 'active' })
   */
  async findOneBy(criteria: Partial<T>, includeDeleted = false): Promise<T | null> {
    const query = this.newQuery();
    
    Object.entries(criteria).forEach(([key, value]) => {
      query.where(key, '=', value);
    });

    if (!includeDeleted) query.whereNull('deleted_at');
    
    return query.first();
  }

  async findAll(includeDeleted = false): Promise<T[]> {
    const query = this.newQuery();
    if (!includeDeleted) query.whereNull('deleted_at');
    return this.applyScopes(query).get();
  }

  async paginate(page: number = 1, limit: number = 15, includeDeleted = false) {
    const query = this.newQuery();
    if (!includeDeleted) query.whereNull('deleted_at');
    
    // Leverage the QueryBuilder's built-in pagination
    return this.applyScopes(query).paginate(page, limit);
  }

  // --- Write Operations (With Hooks) ---

  async create(data: Partial<T>): Promise<T> {
    // 1. Apply Hooks (if any)
    const processedData = (this as any).beforeCreate ? await (this as any).beforeCreate(data) : data;

    const now = new Date();
    
    // 2. Prepare Data
    const rawData = {
      ...processedData,
      created_at: now,
    };

    // 3. Conditionally Add updated_at
    if (this.useTimestamps) {
      rawData.updated_at = now;
    }

    // 4. SANITIZE (Crucial Step)
    const insertData = this.cleanForDb(rawData);

    // 5. Execute
    const id = await this.newQuery().insert(insertData);

    // 6. Return
    const createdItem = { ...insertData, id } as T;
    if ((this as any).afterCreate) await (this as any).afterCreate(createdItem);
    return createdItem;
  }

  async createMany(data: Partial<T>[]): Promise<number> {
    if (data.length === 0) return 0;
    const now = new Date();

    const insertData = data.map(item => {
      const row: any = { ...item, created_at: now };
      if (this.useTimestamps) row.updated_at = now;
      return this.cleanForDb(row); // Sanitize every row
    });

    return this.newQuery().insertMany(insertData);
  }
  async update(id: number, data: Partial<T>, updatedBy?: number): Promise<boolean> {
    const processedData = (this as any).beforeUpdate ? await (this as any).beforeUpdate(id, data) : data;

    const updateData: any = { ...processedData };
    
    // Only update timestamp if configured
    if (this.useTimestamps) {
      updateData.updated_at = new Date();
    }

    // Handle the updatedBy logic if your tables support it
    if (updatedBy && 'updated_by' in updateData === false) {
       // Only add it if the generic T allows it, or cast to any
       updateData.updated_by = updatedBy;
    }

    // Sanitize
    const cleanData = this.cleanForDb(updateData);

    const query = this.newQuery().where('id', '=', id);
    if (this.useSoftDeletes) query.whereNull('deleted_at');

    const affected = await query.update(cleanData);
    return affected > 0;
  }

  /**
   * "Upsert" functionality.
   * If ID exists in data, update. If not, create.
   */
  async save(data: Partial<T>): Promise<T | boolean> {
    if (data.id) {
       // We cast data.id to number, assuming strict typing
       const success = await this.update(data.id as number, data);
       return success;
    } else {
       return this.create(data);
    }
  }

  // --- Delete Operations ---

  async softDelete(id: number, deletedBy?: number): Promise<boolean> {
    const updateData: any = {
      deleted_at: new Date(),
      ...(deletedBy && { deleted_by: deletedBy })
    };

    const affectedRows = await this.newQuery()
      .where('id', '=', id)
      .whereNull('deleted_at')
      .update(updateData);

    return affectedRows > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const affectedRows = await this.newQuery()
      .where('id', '=', id)
      .delete();
    return affectedRows > 0;
  }

  async restore(id: number): Promise<boolean> {
    const affectedRows = await this.newQuery()
      .where('id', '=', id)
      .whereNotNull('deleted_at')
      .update({
        deleted_at: null,
        deleted_by: null,
      } as any);

    return affectedRows > 0;
  }

  // --- Hooks Stubs (Override these in your specific repositories) ---
  
  async beforeCreate(data: Partial<T>): Promise<Partial<T>> { return data; }
  async afterCreate(data: T): Promise<void> { }
  async beforeUpdate(id: number, data: Partial<T>): Promise<Partial<T>> { return data; }
  async afterUpdate(id: number, data: Partial<T>): Promise<void> { }
}

export default BaseRepository;
