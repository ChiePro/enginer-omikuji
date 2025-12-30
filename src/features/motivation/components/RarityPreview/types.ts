export interface RarityTierData {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  label: string;
  probability: number;
  color: string;
  effects?: {
    glow?: boolean;
    sparkle?: boolean;
    animation?: string;
  };
}

export interface RarityPreviewProps {
  tiers: RarityTierData[];
  showProbabilities?: boolean;
  animateOnScroll?: boolean;
}