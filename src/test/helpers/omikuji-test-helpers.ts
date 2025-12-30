import { OmikujiType } from '../../domain/entities/OmikujiType'
import { OmikujiColorScheme } from '../../domain/valueObjects/OmikujiColorScheme'

/**
 * テスト用のOmikujiTypeファクトリ
 * テストデータの作成を簡素化する
 */
export function createTestOmikujiType(params: Partial<{
  id: string;
  name: string;
  description: string;
  icon: string;
  color: { primary: string; secondary: string; accent?: string };
  sortOrder: number;
}> = {}): OmikujiType {
  const defaults = {
    id: 'test-omikuji',
    name: 'テストおみくじ',
    description: 'テスト用の説明',
    icon: '🎯',
    color: { primary: '#3B82F6', secondary: '#1E40AF' },
    sortOrder: 1
  };

  const merged = { ...defaults, ...params };

  return OmikujiType.create(merged);
}

/**
 * テスト用のカラースキームファクトリ
 */
export function createTestColorScheme(params: Partial<{
  primary: string;
  secondary: string;
  accent?: string;
}> = {}): OmikujiColorScheme {
  const defaults = {
    primary: '#3B82F6',
    secondary: '#1E40AF'
  };

  const merged = { ...defaults, ...params };

  return OmikujiColorScheme.create(merged);
}

/**
 * 複数のテストおみくじタイプを作成
 */
export function createTestOmikujiTypes(): OmikujiType[] {
  return [
    createTestOmikujiType({
      id: 'engineer-fortune',
      name: 'エンジニア運勢',
      description: '今日のコーディングを占う',
      icon: '⚡',
      color: { primary: '#3B82F6', secondary: '#1E40AF' },
      sortOrder: 1
    }),
    createTestOmikujiType({
      id: 'tech-selection',
      name: '技術選定おみくじ',
      description: '次に学ぶ技術を決める',
      icon: '🎲',
      color: { primary: '#10B981', secondary: '#065F46' },
      sortOrder: 2
    }),
    createTestOmikujiType({
      id: 'debug-fortune',
      name: 'デバッグ運',
      description: 'バグ解決のヒントを得る',
      icon: '🐛',
      color: { primary: '#EF4444', secondary: '#991B1B' },
      sortOrder: 3
    })
  ];
}