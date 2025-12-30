import { Saisen } from '../../../domain/valueObjects/Saisen';
import { SaisenOptionData } from '../components/SaisenSelector/types';

export function convertSaisenToOptionData(saisen: Saisen): SaisenOptionData {
  return {
    id: getSaisenId(saisen),
    name: saisen.getName(),
    amount: saisen.getAmount(),
    description: saisen.getDescription(),
    hasEffect: saisen.hasEffect(),
    hasSpecialAnimation: saisen.hasSpecialAnimation(),
    isSpecial: saisen.isSpecial()
  };
}

export function convertSaisenListToOptionData(saisenList: Saisen[]): SaisenOptionData[] {
  return saisenList.map(convertSaisenToOptionData);
}

export function getSaisenId(saisen: Saisen): string {
  if (saisen === Saisen.GOEN) return 'goen';
  if (saisen === Saisen.FIFTY_YEN) return 'fifty-yen';
  if (saisen === Saisen.HUNDRED_YEN) return 'hundred-yen';
  if (saisen === Saisen.FIVE_HUNDRED_YEN) return 'five-hundred-yen';
  if (saisen === Saisen.DEBUG_BUG) return 'debug-bug';
  
  // フォールバック: 名前をケバブケースに変換
  return saisen.getName()
    .toLowerCase()
    .replace(/[（）]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function findSaisenById(id: string): Saisen | null {
  const allSaisen = Saisen.getAllPredefinedSaisen();
  
  for (const saisen of allSaisen) {
    if (getSaisenId(saisen) === id) {
      return saisen;
    }
  }
  
  return null;
}