import { InvalidColorCodeError, InsufficientContrastError } from '../errors/ApplicationErrors';

export interface ColorSchemeParams {
  primary: string;
  secondary: string;
  accent?: string;
}

export class OmikujiColorScheme {
  private constructor(
    private readonly primary: string,
    private readonly secondary: string,
    private readonly accent?: string
  ) {}

  static create(params: ColorSchemeParams): OmikujiColorScheme {
    this.validateColorCode(params.primary);
    this.validateColorCode(params.secondary);
    
    if (params.accent) {
      this.validateColorCode(params.accent);
    }

    this.validateContrast(params.primary, params.secondary);

    return new OmikujiColorScheme(
      params.primary,
      params.secondary,
      params.accent
    );
  }

  private static validateColorCode(color: string): void {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(color)) {
      throw new InvalidColorCodeError(`無効なカラーコードです: ${color}`);
    }
  }

  private static validateContrast(primary: string, secondary: string): void {
    const contrastRatio = this.calculateContrastRatio(primary, secondary);
    if (contrastRatio < 4.5) {
      throw new InsufficientContrastError('WCAG AAのコントラスト比を満たしていません');
    }
  }

  private static calculateContrastRatio(color1: string, color2: string): number {
    // WCAG 2.1のコントラスト比計算実装
    
    // RGB値を取得
    const getRGB = (color: string): [number, number, number] => {
      const hex = color.replace('#', '');
      const fullHex = hex.length === 3 ? 
        hex.split('').map(c => c + c).join('') : hex;
      return [
        parseInt(fullHex.substr(0, 2), 16),
        parseInt(fullHex.substr(2, 2), 16),
        parseInt(fullHex.substr(4, 2), 16)
      ];
    };

    // 相対輝度計算
    const getRelativeLuminance = (rgb: [number, number, number]): number => {
      const [r, g, b] = rgb.map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const rgb1 = getRGB(color1);
    const rgb2 = getRGB(color2);
    
    const luminance1 = getRelativeLuminance(rgb1);
    const luminance2 = getRelativeLuminance(rgb2);
    
    const ratio = (Math.max(luminance1, luminance2) + 0.05) / 
                  (Math.min(luminance1, luminance2) + 0.05);

    return Math.round(ratio * 100) / 100; // 小数点以下2桁で丸める
  }

  // 振る舞い：アクセシビリティ準拠の確認
  isAccessible(): boolean {
    return OmikujiColorScheme.calculateContrastRatio(this.primary, this.secondary) >= 4.5;
  }

  // 振る舞い：Tailwind CSS クラス生成
  toTailwindClasses(): { primary: string; secondary: string; accent?: string } {
    return {
      primary: this.colorToTailwind(this.primary),
      secondary: this.colorToTailwind(this.secondary),
      accent: this.accent ? this.colorToTailwind(this.accent) : undefined
    };
  }

  private colorToTailwind(hex: string): string {
    // HEX色をTailwind CSSクラスに変換
    return `bg-[${hex}]`;
  }

  // ゲッター
  getPrimary(): string {
    return this.primary;
  }

  getSecondary(): string {
    return this.secondary;
  }

  getAccent(): string | undefined {
    return this.accent;
  }
}