import { describe, it, expect } from 'vitest';
import { Description } from './Description';

describe('Description', () => {
  describe('文字数制限の検証', () => {
    it('100文字未満の場合はエラーを返す', () => {
      // Given
      const shortDescription = 'このような短い説明文では足りません'; // 18文字

      // When
      const result = Description.create(shortDescription);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('DESCRIPTION_TOO_SHORT');
      expect(result.error.message).toContain('100文字以上');
    });

    it('300文字を超える場合はエラーを返す', () => {
      // Given
      const longDescription = 'このような非常に長い説明文は300文字の制限を大幅に超えることになります。'.repeat(10); // 370文字

      // When
      const result = Description.create(longDescription);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('DESCRIPTION_TOO_LONG');
      expect(result.error.message).toContain('300文字以下');
    });

    it('100-300文字の範囲内で適切な内容がある場合は成功する', () => {
      // Given
      const validDescription = 'コードレビューで神のようなアドバイスをもらえそうです。バグの発見も早く、リファクタリングのアイデアも浮かびやすい一日となるでしょう。チームとのコミュニケーションも円滑で、技術的な課題に対して最適な解決策を見つけられそうです。プロジェクトが順調に進展し、素晴らしい成果が待っている予感がします。'; // 135文字

      // When
      const result = Description.create(validDescription);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.getValue()).toBe(validDescription);
    });
  });

  describe('内容の妥当性検証', () => {
    it('空白文字のみの説明文はエラーとなる', () => {
      // Given  
      const whitespaceDescription = '\u3000  \u3000  \u3000  \u3000  '.repeat(25); // 全角・半角空白混合、100文字以上

      // When
      const result = Description.create(whitespaceDescription);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('DESCRIPTION_INVALID_CONTENT');
    });

    it('おみくじらしい期待感のある表現が含まれる場合は成功する', () => {
      // Given
      const fortuneDescription = 'あなたの技術力が開花する素晴らしい一日になりそうです。新しいフレームワークの習得やアーキテクチャの理解が深まり、チーム内での評価も高まるでしょう。積極的に挑戦することで大きな成果を得られる予感がします。'; // 117文字

      // When
      const result = Description.create(fortuneDescription);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.hasFortuneExpression()).toBe(true);
    });

    it('エンジニア関連の内容が含まれる場合は成功する', () => {
      // Given
      const engineerDescription = 'CI/CDパイプラインの構築が順調に進み、デプロイの自動化も完璧に動作するでしょう。コードの品質が向上し、テストカバレッジも理想的なレベルに到達しそうです。技術的な課題を解決する絶好のタイミングです。'; // 117文字

      // When
      const result = Description.create(engineerDescription);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.hasEngineerContent()).toBe(true);
    });
  });

  describe('メソッドの動作検証', () => {
    it('有効な説明文の場合、長さ検証がtrueを返す', () => {
      // Given
      const description = Description.create('コーディング作業が非常に順調に進む一日となりそうです。新機能の実装もスムーズで、バグの修正も効率的に行えるでしょう。チームメンバーとの連携も良好で、プロジェクトが大きく前進する予感がします。さらに技術的なスキルも向上し、理想的なコードが書けるでしょう。').value;

      // When & Then
      expect(description.isValidLength()).toBe(true);
    });

    it('文字数カウントが正確に動作する', () => {
      // Given
      const testText = 'テスト用の説明文です。'.repeat(10); // 110文字
      const description = Description.create(testText).value;

      // When & Then  
      expect(description.getCharacterCount()).toBe(110);
    });
  });
});