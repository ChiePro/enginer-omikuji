import { OmikujiType } from '../../../domain/entities/OmikujiType';
import { OmikujiTypeData } from '../components/OmikujiCard/types';

export function convertOmikujiTypeToCardData(omikujiType: OmikujiType): OmikujiTypeData {
  return {
    id: omikujiType.id.getValue(),
    name: omikujiType.name,
    description: omikujiType.description,
    icon: omikujiType.icon,
    color: {
      primary: omikujiType.color.getPrimary(),
      secondary: omikujiType.color.getSecondary(),
      accent: omikujiType.color.getAccent()
    },
    route: `/omikuji/${omikujiType.id.getValue()}`
  };
}