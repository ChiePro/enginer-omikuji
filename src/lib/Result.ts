/**
 * Result<T, E> - Functional error handling pattern
 * Represents either a success (Ok) or failure (Err) value
 */
export abstract class Result<T, E> {
  abstract isSuccess(): boolean;
  abstract isError(): boolean;
  abstract get value(): T;
  abstract get error(): E;

  static success<T, E>(value: T): Result<T, E> {
    return new Ok(value);
  }

  static error<T, E>(error: E): Result<T, E> {
    return new Err(error);
  }
}

class Ok<T, E> extends Result<T, E> {
  constructor(private readonly _value: T) {
    super();
  }

  isSuccess(): boolean {
    return true;
  }

  isError(): boolean {
    return false;
  }

  get value(): T {
    return this._value;
  }

  get error(): E {
    throw new Error('Called error on Ok value');
  }
}

class Err<T, E> extends Result<T, E> {
  constructor(private readonly _error: E) {
    super();
  }

  isSuccess(): boolean {
    return false;
  }

  isError(): boolean {
    return true;
  }

  get value(): T {
    throw new Error('Called value on Err value');
  }

  get error(): E {
    return this._error;
  }
}