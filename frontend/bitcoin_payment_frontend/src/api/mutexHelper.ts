export class Mutex {
  private whiteList: Set<string>;
  private locks: Map<string, Promise<void>>;

  constructor(whiteList: string[] = []) {
    this.whiteList = new Set(whiteList);
    this.locks = new Map();
  }

  async lock(key: string): Promise<boolean | (() => void)> {
    if (this.whiteList.has(key)) {
      return true;
    }

    let release!: () => void;
    const newLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const currentLock = this.locks.get(key);
    if (currentLock) {
      await currentLock; // Espera a que se libere
    }

    this.locks.set(key, newLock);
    return () => {
      release();
      this.locks.delete(key);
    };
  }

  unlock(key: string): void {
    if (this.whiteList.has(key)) return;
    this.locks.delete(key);
  }
}
