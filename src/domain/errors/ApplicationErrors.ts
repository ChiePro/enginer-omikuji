export class OmikujiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'OmikujiError';
  }
}

export class InvalidOmikujiTypeIdError extends OmikujiError {
  constructor(message: string) {
    super(message, 'INVALID_OMIKUJI_TYPE_ID', 400);
    this.name = 'InvalidOmikujiTypeIdError';
  }
}

export class InvalidColorCodeError extends OmikujiError {
  constructor(message: string) {
    super(message, 'INVALID_COLOR_CODE', 400);
    this.name = 'InvalidColorCodeError';
  }
}

export class InsufficientContrastError extends OmikujiError {
  constructor(message: string) {
    super(message, 'INSUFFICIENT_CONTRAST', 400);
    this.name = 'InsufficientContrastError';
  }
}

export class InvalidSaisenAmountError extends OmikujiError {
  constructor(message: string) {
    super(message, 'INVALID_SAISEN_AMOUNT', 400);
    this.name = 'InvalidSaisenAmountError';
  }
}