import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

// Pattern presets from subtle patterns
const PATTERN_PRESETS = [
  {
    name: 'Subtle Dots',
    url: 'https://www.transparenttextures.com/patterns/subtle-dots.png',
    preview: '#f9fafb'
  },
  {
    name: 'Grid',
    url: 'https://www.transparenttextures.com/patterns/grid.png',
    preview: '#f5f7fa' 
  },
  {
    name: 'Diamond Upholstery',
    url: 'https://www.transparenttextures.com/patterns/diamond-upholstery.png',
    preview: '#eef2f6'
  },
  {
    name: 'Concrete Wall',
    url: 'https://www.transparenttextures.com/patterns/concrete-wall.png',
    preview: '#f0f4f8'
  },
  {
    name: 'Cubes',
    url: 'https://www.transparenttextures.com/patterns/cubes.png',
    preview: '#e8eef4'
  },
  {
    name: 'Brushed Alum',
    url: 'https://www.transparenttextures.com/patterns/brushed-alum.png',
    preview: '#f2f6fa'
  }
];

// Gradient presets
const GRADIENT_PRESETS = [
  {
    name: 'Sky',
    value: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)',
    preview: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)'
  },
  {
    name: 'Lavender',
    value: 'linear-gradient(to bottom right, #f3e8ff, #faf5ff)',
    preview: 'linear-gradient(to bottom right, #f3e8ff, #faf5ff)'
  },
  {
    name: 'Sand',
    value: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)',
    preview: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)'
  },
  {
    name: 'Mint',
    value: 'linear-gradient(to bottom right, #d1fae5, #ecfdf5)',
    preview: 'linear-gradient(to bottom right, #d1fae5, #ecfdf5)'
  },
  {
    name: 'Sunset',
    value: 'linear-gradient(to bottom right, #fee2e2, #fff1f2)',
    preview: 'linear-gradient(to bottom right, #fee2e2, #fff1f2)'
  },
  {
    name: 'Royal',
    value: 'linear-gradient(to bottom right, #e0e7ff, #eef2ff)',
    preview: 'linear-gradient(to bottom right, #e0e7ff, #eef2ff)'
  }
];

// Sample background images
const BACKGROUND_PRESETS = [
  {
    name: 'Soft Blue',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=500&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Geometric',
    url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=500&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Light Texture',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=500&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Minimal Light',
    url: 'https://images.unsplash.com/photo-1517816428104-797678c7cf0c?q=80&w=500&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1517816428104-797678c7cf0c?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Paper Texture',
    url: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=500&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=150&auto=format&fit=crop'
  },
  {
    name: 'Soft Gradient',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=500&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=150&auto=format&fit=crop'
  }
];

interface PatternPresetsProps {
  value: string;
  onChange: (pattern: string) => void;
}

export function PatternPresets({ value, onChange }: PatternPresetsProps) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-3">Pattern Presets</h3>
      <div className="grid grid-cols-3 gap-3">
        {PATTERN_PRESETS.map((pattern) => (
          <Card 
            key={pattern.name}
            className={`cursor-pointer overflow-hidden border-2 ${value === pattern.url ? 'border-primary' : 'border-border'}`}
            onClick={() => onChange(pattern.url)}
          >
            <div 
              className="h-16 w-full relative"
              style={{ 
                backgroundColor: pattern.preview,
                backgroundImage: `url(${pattern.url})`,
                backgroundRepeat: 'repeat'
              }}
            >
              {value === pattern.url && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate">{pattern.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface GradientPresetsProps {
  value: string;
  onChange: (gradient: string) => void;
}

export function GradientPresets({ value, onChange }: GradientPresetsProps) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-3">Gradient Presets</h3>
      <div className="grid grid-cols-3 gap-3">
        {GRADIENT_PRESETS.map((gradient) => (
          <Card 
            key={gradient.name}
            className={`cursor-pointer overflow-hidden border-2 ${value === gradient.value ? 'border-primary' : 'border-border'}`}
            onClick={() => onChange(gradient.value)}
          >
            <div 
              className="h-16 w-full relative"
              style={{ 
                backgroundImage: gradient.preview
              }}
            >
              {value === gradient.value && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate">{gradient.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ImagePresetsProps {
  value: string;
  onChange: (image: string) => void;
}

export function ImagePresets({ value, onChange }: ImagePresetsProps) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-3">Background Image Presets</h3>
      <div className="grid grid-cols-3 gap-3">
        {BACKGROUND_PRESETS.map((image) => (
          <Card 
            key={image.name}
            className={`cursor-pointer overflow-hidden border-2 ${value === image.url ? 'border-primary' : 'border-border'}`}
            onClick={() => onChange(image.url)}
          >
            <div 
              className="h-16 w-full relative"
              style={{ 
                backgroundImage: `url(${image.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {value === image.url && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate">{image.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Background preview component
interface BackgroundPreviewProps {
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  color: string;
  gradient: string;
  pattern: string;
  image: string;
}

export function BackgroundPreview({ type, color, gradient, pattern, image }: BackgroundPreviewProps) {
  return (
    <div 
      className="h-32 w-full rounded-md border border-border overflow-hidden"
      style={{ 
        backgroundColor: type === 'solid' ? color : undefined,
        backgroundImage: type === 'gradient' 
          ? gradient 
          : type === 'pattern' 
            ? `url(${pattern})`
            : type === 'image'
              ? `url(${image})`
              : 'none',
        backgroundSize: type === 'pattern' ? 'auto' : 'cover',
        backgroundRepeat: type === 'pattern' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <div className="h-full w-full flex flex-col items-center justify-center">
        <div className="p-2 bg-white rounded-lg shadow-sm inline-flex">
          <span className="text-sm">Background Preview</span>
        </div>
      </div>
    </div>
  );
}