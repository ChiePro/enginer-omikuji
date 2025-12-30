'use client';

import React from 'react';
import { OmikujiCard } from '../OmikujiCard';
import { OmikujiTypeService } from '../../../../domain/services/OmikujiTypeService';
import { convertOmikujiTypeToCardData } from '../../utils/omikujiTypeConverter';

export interface OmikujiTypeGridProps {
  onSelect: (typeId: string) => void;
}

export const OmikujiTypeGrid: React.FC<OmikujiTypeGridProps> = ({ onSelect }) => {
  const omikujiTypes = OmikujiTypeService.getDefaultOmikujiTypes();
  const cardDataList = omikujiTypes.map(convertOmikujiTypeToCardData);

  return (
    <section 
      role="region" 
      aria-label="おみくじの種類を選択"
      className="py-8"
    >
      <h2 
        id="omikuji-types" 
        className="text-3xl font-bold text-center mb-8 text-slate-800"
      >
        おみくじを選ぶ
      </h2>
      
      <div 
        data-testid="omikuji-type-grid"
        role="group" 
        aria-labelledby="omikuji-types"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4"
      >
        {cardDataList.map((omikujiTypeData) => (
          <OmikujiCard
            key={omikujiTypeData.id}
            omikujiType={omikujiTypeData}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
};