export class Mutex {
  private whiteList: Set<string>;
  private locks: Map<string, Promise<void>>;

  constructor(whiteList: string[] = []) {
    this.whiteList = new Set(whiteList);
    this.locks = new Map();
  }

  async lock(key: string): Promise<(() => void) | true> {
    if (this.whiteList.has(key)) {
      return true;
    }

    let resolveFunc!: () => void;
    const newLock = new Promise<void>((resolve) => {
      resolveFunc = resolve;
    });

    const existingLock = this.locks.get(key);
    if (existingLock) {
      await existingLock;
    }

    this.locks.set(key, newLock);

    return () => {
      resolveFunc();
      this.locks.delete(key);
    };
  }

  async tryLock(key: string): Promise<boolean> {
    if (this.whiteList.has(key)) {
      return true;
    }

    if (this.locks.has(key)) {
      return false;
    }

    this.locks.set(key, Promise.resolve());
    return true;
  }

  unlock(key: string): void {
    if (this.whiteList.has(key)) {
      return;
    }

    this.locks.delete(key);
  }
}
