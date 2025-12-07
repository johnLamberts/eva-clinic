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

  constructor(connection?: PoolConnection) {
    this.connection = connection;
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

  protected newQuery(): QueryBuilder<T> {
    return new QueryBuilder<T>(this.tableName, this.connection);
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
    // 1. Hook: Before Create
    const processedData = this.beforeCreate ? await this.beforeCreate(data) : data;

    const now = new Date();
    const insertData = {
      ...processedData,
      created_at: now,
      updated_at: now,
    };

    // 2. Perform Insert
    const id = await this.newQuery().insert(insertData);

    // 3. Return complete object
    const createdItem = { ...insertData, id } as T;

    // 4. Hook: After Create
    if (this.afterCreate) await this.afterCreate(createdItem);

    return createdItem;
  }

  async createMany(data: Partial<T>[]): Promise<number> {
    if (data.length === 0) return 0;
    
    const now = new Date();
    const insertData = data.map(item => ({
      ...item,
      created_at: now,
      updated_at: now
    }));

    return this.newQuery().insertMany(insertData);
  }

  async update(id: number, data: Partial<T>, updatedBy?: number): Promise<boolean> {
    // 1. Hook: Before Update
    const processedData = this.beforeUpdate ? await this.beforeUpdate(id, data) : data;

    const updateData = {
      ...processedData,
      updated_at: new Date(),
      ...(updatedBy && { updated_by: updatedBy }),
    };

    // 2. Perform Update
    const affectedRows = await this.newQuery()
      .where('id', '=', id)
      .whereNull('deleted_at')
      .update(updateData);

    // 3. Hook: After Update
    if (this.afterUpdate && affectedRows > 0) await this.afterUpdate(id, updateData);

    return affectedRows > 0;
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
