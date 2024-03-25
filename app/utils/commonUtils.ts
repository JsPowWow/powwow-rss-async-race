import type { AnyVoidFunction, ConstructorOf, Nil, Nullable } from './types';

export function isNil<T>(value: Nullable<T>): value is Nil {
  return value === null || value === undefined;
}

export function isSome<T>(value: unknown): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function assertIsNonNullable<T>(value: unknown, ...infos: Array<unknown>): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`Nullish assertion Error: "${String(value)}"; ${infos?.join(' ')}`);
  }
}

export function assertIsInstanceOf<T>(elemType: ConstructorOf<T>, value: unknown): asserts value is T {
  assertIsNonNullable(value, `#${String(elemType)}`);
  if (!(value instanceof elemType)) {
    throw new Error(`Not expected value: ${String(value)} of type: "${String(elemType)}"`);
  }
}

export function isInstanceOf<T>(elemType: ConstructorOf<T>, value: unknown): value is T {
  return value instanceof elemType;
}
export function isHTMLElementTag<Tag extends keyof HTMLElementTagNameMap>(value: unknown): value is Tag {
  return typeof value === 'string';
}

export const queryElement = <ElementType extends Element>(
  selector: string,
  elemType?: ConstructorOf<ElementType>,
  parentNode?: Element | Document | DocumentFragment,
): ElementType => {
  const result = (parentNode ?? document).querySelector<ElementType>(selector);
  assertIsInstanceOf(elemType ?? Element, result);
  return result;
};

export const noop = (..._: unknown[]): void => {
  /** This is intentional */
};

export const identity = <T>(source: T): T => source;

/**
 * @description Return shuffled array.
 * @param {Array} arr
 */
export const toShuffledArray = <T>(arr: Array<T>): Array<T> => {
  const result = [];
  let j;
  let x;
  let index;
  for (index = arr.length - 1; index > 0; index -= 1) {
    j = Math.floor(Math.random() * (index + 1));
    x = arr[index];
    result[index] = arr[j];
    result[j] = x;
  }
  return result;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export function debounce<T extends AnyVoidFunction>(func: T, wait: number, immediate?: boolean) {
  let timeout: ReturnType<typeof setTimeout> | 0;
  // eslint-disable-next-line func-names
  return function <U>(this: U, ...args: Parameters<typeof func>): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    if (immediate && !timeout) {
      func.apply(context, args);
    }
    timeout = setTimeout(() => {
      timeout = 0;
      if (!immediate) {
        func.apply(context, args);
      }
    }, wait);
  };
}
