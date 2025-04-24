import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  description?: string;
}

export function ColorPicker({ 
  color, 
  onChange, 
  label = 'Color',
  description
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only trigger onChange if it's a valid hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-stretch">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="pr-12"
            placeholder="#RRGGBB"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <div
              className="h-6 w-6 rounded border border-gray-300"
              style={{ backgroundColor: inputValue }}
            ></div>
          </div>
        </div>
        <Input
          type="color"
          value={inputValue}
          onChange={handleColorChange}
          className="w-12 h-10 p-1 cursor-pointer"
        />
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
