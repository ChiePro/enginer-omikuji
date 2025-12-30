export interface OmikujiTypeData {
  id: string;
  name: string;
  description: string;
  icon: string | React.ReactNode;
  color: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  route: string;
}

export interface OmikujiCardProps {
  omikujiType: OmikujiTypeData;
  onSelect: (typeId: string) => void;
  isDisabled?: boolean;
}