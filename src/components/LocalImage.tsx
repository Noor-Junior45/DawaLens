import React, { useState, useEffect } from 'react';
import { localImageStorage } from '../services/localImageStorage';

interface LocalImageProps {
  medicineId: string;
  className?: string;
}

export const LocalImage: React.FC<LocalImageProps> = ({ medicineId, className }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    localImageStorage.getImage(medicineId).then((img) => {
      if (active && img) {
        setSrc(img);
      }
    });
    return () => {
      active = false;
    };
  }, [medicineId]);

  if (!src) return null;

  return (
    <img 
      src={src} 
      alt="" 
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};
