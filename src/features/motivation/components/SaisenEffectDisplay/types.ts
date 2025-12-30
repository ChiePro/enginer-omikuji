export interface SaisenEffectDisplayProps {
  currentSaisen: string | null; // Saisenの名前
  remainingDraws?: number;
  showAnimation?: boolean;
  onReset?: () => void;
}