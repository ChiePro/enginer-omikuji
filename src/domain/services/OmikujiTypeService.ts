import { OmikujiType } from '../entities/OmikujiType';

export class OmikujiTypeService {
  private static defaultTypes: OmikujiType[] = [
    OmikujiType.create({
      id: 'engineer-fortune',
      name: 'エンジニア運勢',
      description: '今日のコーディングを占う',
      icon: '⚡',
      color: { primary: '#3B82F6', secondary: '#1E40AF' },
      sortOrder: 1
    }),
    OmikujiType.create({
      id: 'tech-selection',
      name: '技術選定おみくじ',
      description: '次に学ぶ技術を決める',
      icon: '🎲',
      color: { primary: '#10B981', secondary: '#065F46' },
      sortOrder: 2
    }),
    OmikujiType.create({
      id: 'debug-fortune',
      name: 'デバッグ運',
      description: 'バグ解決のヒントを得る',
      icon: '🐛',
      color: { primary: '#EF4444', secondary: '#991B1B' },
      sortOrder: 3
    }),
    OmikujiType.create({
      id: 'review-fortune',
      name: 'コードレビュー運',
      description: 'レビューの結果を予想',
      icon: '👀',
      color: { primary: '#10B981', secondary: '#047857' },
      sortOrder: 4
    }),
    OmikujiType.create({
      id: 'deploy-fortune',
      name: 'デプロイ運',
      description: 'デプロイの成功を占う',
      icon: '🚀',
      color: { primary: '#F59E0B', secondary: '#D97706' },
      sortOrder: 5
    })
  ];

  static getDefaultOmikujiTypes(): OmikujiType[] {
    // 新しい配列を返してイミュータビリティを保つ
    return [...this.defaultTypes];
  }

  static findById(id: string): OmikujiType | undefined {
    return this.defaultTypes.find(type => type.id.getValue() === id);
  }
}