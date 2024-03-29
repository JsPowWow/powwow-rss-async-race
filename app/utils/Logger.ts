import type { AnyValue } from './types.ts';

const DEFAULT_LOGGER = 'default';
const logInstances = new Map<string, ScopedLogger>();
const enabledScopedLoggers = new Map();

export interface ILogger {
  info: (...args: AnyValue[]) => void;
  warn: (...args: AnyValue[]) => void;
  error: (...args: AnyValue[]) => void;
}

export type WithDebugOptions<T> =
  | (T & {
      debug: true;
      logger: ILogger;
    })
  | (T & { debug?: false });

export interface ScopedLogger extends ILogger {
  setEnabled: (value: boolean) => ScopedLogger;
  get scope(): string;
}

const setLoggerEnabled = (logger: ScopedLogger, enable: boolean): void => {
  if (enable) {
    enabledScopedLoggers.set(logger, true);
  } else {
    enabledScopedLoggers.delete(logger);
  }
};

const isLoggerEnabled = (logger: ScopedLogger): boolean =>
  logger && (logger.scope === DEFAULT_LOGGER || enabledScopedLoggers.get(logger) === true);

class ConsoleLoggerScoped implements ScopedLogger {
  private readonly loggerScope: string;

  constructor(scope: string) {
    this.loggerScope = scope;
  }

  public get scope(): string {
    return this.loggerScope;
  }

  public get enabled(): boolean {
    return isLoggerEnabled(this);
  }

  public setEnabled = (value: boolean): typeof this => {
    setLoggerEnabled(this, value);
    return this;
  };

  public info = (...args: unknown[]): void => {
    if (isLoggerEnabled(this)) {
      // eslint-disable-next-line  no-console
      console.info(`[[${this.loggerScope}]]\t`, ...args);
    }
  };

  public warn = (...args: unknown[]): void => {
    if (isLoggerEnabled(this)) {
      // eslint-disable-next-line  no-console
      console.warn(`[[${this.loggerScope}]]\t`, ...args);
    }
  };

  public error = (...args: unknown[]): void => {
    if (isLoggerEnabled(this)) {
      // eslint-disable-next-line  no-console
      console.error(`[[${this.loggerScope}]]\t`, ...args);
    }
  };
}

export const getLogger = (scope = DEFAULT_LOGGER): ScopedLogger => {
  const thisScope = scope || DEFAULT_LOGGER;
  let logger = logInstances.get(scope);
  if (!logger) {
    logger = Object.freeze(new ConsoleLoggerScoped(thisScope));
    logInstances.set(thisScope, logger);
  }
  return logger;
};

export default getLogger(DEFAULT_LOGGER);
