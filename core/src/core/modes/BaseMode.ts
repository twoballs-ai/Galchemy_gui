import { Core } from '../Core';

// Базовый интерфейс режима — хранит ссылку на Core
export class BaseMode {
  protected core!: Core;

  enter(core: Core): void {
    this.core = core;
  }

  exit(): void {
    // Можно переопределить в потомках
  }

  update(_dt?: number): void {
    // Можно переопределить в потомках
  }
}
