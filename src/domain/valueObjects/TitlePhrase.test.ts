import { describe, it, expect } from 'vitest';
import { TitlePhrase } from './TitlePhrase';

describe('TitlePhrase', () => {
  describe('文字数制限の検証', () => {
    it('20文字未満の場合はエラーを返す', () => {
      // Given
      const shortTitle = '短いタイトル';  // 6文字

      // When
      const result = TitlePhrase.create(shortTitle);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('TITLE_TOO_SHORT');
      expect(result.error.message).toContain('20文字以上必要');
    });

    it('40文字を超える場合はエラーを返す', () => {
      // Given
      const longTitle = 'このタイトルは40文字を大幅に超える非常に長いタイトルフレーズですが実際には更に長くなっています'; // 42文字

      // When
      const result = TitlePhrase.create(longTitle);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('TITLE_TOO_LONG');
      expect(result.error.message).toContain('40文字以下');
    });

    it('20-40文字の範囲内で目を引く表現がある場合は成功する', () => {
      // Given
      const validTitle = '今日は神レベルのコードが降臨する最高の一日！'; // 23文字、感嘆符あり

      // When
      const result = TitlePhrase.create(validTitle);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.getValue()).toBe(validTitle);
    });
  });

  describe('目を引く表現の検証', () => {
    it('感嘆符がない平坦な表現はエラーとなる', () => {
      // Given
      const plainTitle = '今日はコーディングに関する運勢ですが特に何もない'; // 26文字、平坦

      // When
      const result = TitlePhrase.create(plainTitle);

      // Then
      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('TITLE_NOT_EYE_CATCHING');
    });

    it('極端な表現がある場合は成功する', () => {
      // Given
      const extremeTitle = 'バグゼロでリリース完璧な神レベルの素晴らしい一日'; // 25文字、「完璧」「神」の極端表現

      // When
      const result = TitlePhrase.create(extremeTitle);

      // Then
      expect(result.isSuccess()).toBe(true);
    });

    it('技術的興奮を表現する感嘆符付きタイトル', () => {
      // Given
      const techTitle = 'リファクタリングで脳汁が大放出される日！'; // 23文字、エンジニア表現+感嘆符

      // When
      const result = TitlePhrase.create(techTitle);

      // Then
      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('エンジニア特化表現の検証', () => {
    it('エンジニア用語が含まれる場合は成功', () => {
      // Given
      const engineerTitle = 'CI/CDパイプラインに魂を捧げる神の日！'; // 23文字、エンジニア用語

      // When  
      const result = TitlePhrase.create(engineerTitle);

      // Then
      expect(result.isSuccess()).toBe(true);
      expect(result.value.hasEngineerTerms()).toBe(true);
    });
  });
});