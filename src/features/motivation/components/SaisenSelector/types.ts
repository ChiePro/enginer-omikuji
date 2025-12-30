export interface SaisenOptionData {
  id: string;
  name: string;
  amount: number;
  description: string;
  hasEffect: boolean;
  hasSpecialAnimation: boolean;
  isSpecial: boolean;
}

export interface SaisenSelectorProps {
  onSelect: (saisenId: string) => void;
  currentSelection?: string;
  showEffectDescription?: boolean;
}