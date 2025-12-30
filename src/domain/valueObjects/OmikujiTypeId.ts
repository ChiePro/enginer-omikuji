import { InvalidOmikujiTypeIdError } from '../errors/ApplicationErrors';

export class OmikujiTypeId {
  private constructor(private readonly value: string) {}

  static create(id: string): OmikujiTypeId {
    if (!id || id.trim().length === 0) {
      throw new InvalidOmikujiTypeIdError('おみくじタイプIDは必須です');
    }
    
    if (!/^[a-z0-9-]+$/.test(id)) {
      throw new InvalidOmikujiTypeIdError('IDは英小文字、数字、ハイフンのみ使用可能です');
    }

    return new OmikujiTypeId(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OmikujiTypeId): boolean {
    return this.value === other.value;
  }
}