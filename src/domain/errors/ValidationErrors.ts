export interface ValidationError {
  code: string;
  message: string;
}

export class ValidationError {
  static create(code: string, message: string): ValidationError {
    return { code, message };
  }
}