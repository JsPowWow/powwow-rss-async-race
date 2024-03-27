import type { AnyValue } from '@/utils';

export type EventMap = Record<string, AnyValue>;
export type EventKey<Events extends EventMap> = string & keyof Events;
export type EventListener<Event> = (event: Event) => void;

export interface Emitter<Events extends EventMap> {
  on: <Event extends EventKey<Events>>(eventName: Event, fn: EventListener<Events[Event]>) => void;
  off: <Event extends EventKey<Events>>(eventName: Event, fn: EventListener<Events[Event]>) => void;
  emit: <Event extends EventKey<Events>>(eventName: Event, params: Events[Event]) => void;
}

export class EventEmitter<T extends EventMap> implements Emitter<T> {
  private listeners: {
    [K in keyof EventMap]?: Array<(p: EventMap[K]) => void>;
  } = {};

  public on = <K extends EventKey<T>>(eventName: K, callback: EventListener<T[K]>): void => {
    if (typeof eventName === 'string' && typeof callback === 'function') {
      this.listeners[eventName] = (this.listeners[eventName] ?? []).concat(callback);
    }
  };

  public off = <K extends EventKey<T>>(eventName: K, callback: EventListener<T[K]>): void => {
    if (typeof eventName === 'string' && typeof callback === 'function') {
      this.listeners[eventName] = (this.listeners[eventName] ?? []).filter((f) => f !== callback);
    }
  };

  public emit = <K extends EventKey<T>>(eventName: K, data: T[K]): void => {
    (this.listeners[eventName] ?? []).forEach((fn) => {
      fn(data);
    });
  };

  public hasListener = <K extends EventKey<T>>(eventName: K): boolean => {
    return !!this.listeners[eventName];
  };

  public destroy = (): void => {
    this.listeners = {};
  };
}
