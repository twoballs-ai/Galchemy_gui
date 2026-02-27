type Listener<T = any> = (payload: T) => void;

export class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
  private _events: Map<keyof Events, Listener[]>;

  constructor() {
    this._events = new Map();
  }

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event)!.push(listener as Listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const lst = this._events.get(event);
    if (!lst) return;
    const idx = lst.indexOf(listener as Listener);
    if (idx >= 0) lst.splice(idx, 1);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const lst = this._events.get(event);
    if (!lst) return;
    for (const fn of lst) {
      try {
        fn(payload);
      } catch (e) {
        console.error(`Error in listener for "${String(event)}":`, e);
      }
    }
  }
}
