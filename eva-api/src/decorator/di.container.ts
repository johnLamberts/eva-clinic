import 'reflect-metadata';

export class Container {
  private static services = new Map<any, any>();

  /**
   * The magic resolver
   * 1. Check if instance already exists (Singleton)
   * 2. If not, looks at the constructor parameters
   * 3. Recursively resolves those parameters first
   * Instanstiates the class with the resolved dependecies
   */
  static resolve<T>(target: { new (...args: any[]): T}): T {
    // 1. Return existing instance (Singleton pattern)
    if(this.services.has(target)) {
      return this.services.get(target)
    }

    // 2. Get constructor parameters types via Reflection
    const tokens = Reflect.getMetadata('design:paramtypes', target) || [];

    // 3. Recursively resolve dependecies
    const injections = tokens.map((token: any) => Container.resolve(token));

    // 4. Create instance and store it
    const instance = new target(...injections);
    this.services.set(target, instance);

    return instance;
  }
}
