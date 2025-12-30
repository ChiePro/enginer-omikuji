import { OmikujiTypeId } from '../valueObjects/OmikujiTypeId';
import { OmikujiColorScheme, ColorSchemeParams } from '../valueObjects/OmikujiColorScheme';

export interface OmikujiTypeParams {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: ColorSchemeParams;
  sortOrder: number;
}

export class OmikujiType {
  constructor(
    public readonly id: OmikujiTypeId,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: string,
    public readonly color: OmikujiColorScheme,
    public readonly sortOrder: number
  ) {}

  static create(params: OmikujiTypeParams): OmikujiType {
    const id = OmikujiTypeId.create(params.id);
    const color = OmikujiColorScheme.create(params.color);
    
    return new OmikujiType(
      id,
      params.name,
      params.description,
      params.icon,
      color,
      params.sortOrder
    );
  }

  // 振る舞い：表示順での比較
  compareByOrder(other: OmikujiType): number {
    return this.sortOrder - other.sortOrder;
  }

  // 振る舞い：同一性の判定
  equals(other: OmikujiType): boolean {
    return this.id.equals(other.id);
  }

  // 振る舞い：ユーザー向け表示名の取得
  getDisplayName(): string {
    return `${this.icon} ${this.name}`;
  }
}