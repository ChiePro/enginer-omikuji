import { OmikujiType } from './OmikujiType';
import { Fortune } from '../valueObjects/Fortune';

export interface OmikujiResultParams {
  omikujiType: OmikujiType;
  fortune: Fortune;
}

export class OmikujiResult {
  private readonly id: string;
  private readonly createdAt: Date;

  constructor(
    private readonly omikujiType: OmikujiType,
    private readonly fortune: Fortune,
    id?: string,
    createdAt?: Date
  ) {
    this.id = id || crypto.randomUUID();
    this.createdAt = createdAt || new Date();
  }

  static create(params: OmikujiResultParams): OmikujiResult {
    return new OmikujiResult(params.omikujiType, params.fortune);
  }

  getId(): string {
    return this.id;
  }

  getOmikujiType(): OmikujiType {
    return this.omikujiType;
  }

  getFortune(): Fortune {
    return this.fortune;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getDisplaySummary(): string {
    return `${this.omikujiType.getDisplayName()} - ${this.fortune.getDisplayName()}`;
  }

  equals(other: OmikujiResult): boolean {
    return this.id === other.id;
  }
}