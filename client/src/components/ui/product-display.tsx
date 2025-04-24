import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ProductDisplayProps {
  product: {
    id: number;
    title: string;
    description?: string;
    price: string;
    image?: string;
    stockStatus?: string;
    url?: string;
  };
  onViewMore?: (productId: number) => void;
  brandColor?: string;
}

export function ProductDisplay({ 
  product, 
  onViewMore,
  brandColor = '#4F46E5'
}: ProductDisplayProps) {
  const handleAddToCart = () => {
    if (product.url) {
      window.open(product.url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-sm">
      <div className="aspect-square w-full bg-gray-50 relative overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title}
            className="h-full w-full object-contain" 
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-400 text-sm">No image</p>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
        <p className="mt-2 text-sm text-gray-600 flex-1">
          {product.description && product.description.length > 100 
            ? `${product.description.substring(0, 100)}...` 
            : product.description}
        </p>
        <Button 
          className="w-full mt-3 text-white"
          style={{ backgroundColor: brandColor }}
          onClick={handleAddToCart}
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}

export function ProductList({ 
  products, 
  onViewMore,
  brandColor
}: { 
  products: ProductDisplayProps['product'][];
  onViewMore?: (productId: number) => void;
  brandColor?: string;
}) {
  if (!products.length) return null;
  
  return (
    <div className="grid grid-cols-1 gap-4">
      {products.map((product) => (
        <ProductDisplay 
          key={product.id} 
          product={product} 
          onViewMore={onViewMore}
          brandColor={brandColor}
        />
      ))}
    </div>
  );
}

export function ProductCarousel({
  products,
  brandColor = '#4F46E5'
}: {
  products: ProductDisplayProps['product'][];
  brandColor?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!products.length) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full rounded-lg border border-gray-100 overflow-hidden relative">
      <div className="relative">
        <div className="flex items-center">
          {products.length > 1 && (
            <div 
              className="absolute left-2 z-10 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center shadow-md cursor-pointer"
              onClick={handlePrev}
              role="button"
              tabIndex={0}
              aria-label="Previous product"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handlePrev();
                  e.preventDefault();
                }
              }}
            >
              <ChevronLeft size={20} />
            </div>
          )}

          <div className="w-full overflow-hidden">
            <div 
              className="flex transition-all duration-300" 
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {products.map((product) => (
                <div key={product.id} className="min-w-full">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                    <div className="aspect-[4/3] flex items-center justify-center bg-white rounded-lg overflow-hidden">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.title}
                          className="h-full w-full object-contain" 
                        />
                      ) : (
                        <div className="bg-gray-100 h-full w-full flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {product.description}
                    </p>
                    <Button 
                      className="w-full mt-4 gap-2"
                      style={{ backgroundColor: brandColor }}
                      onClick={() => window.open(product.url, '_blank')}
                    >
                      <ShoppingCart size={16} />
                      Add to cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {products.length > 1 && (
            <div 
              className="absolute right-2 z-10 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center shadow-md cursor-pointer"
              onClick={handleNext}
              role="button"
              tabIndex={0}
              aria-label="Next product"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNext();
                  e.preventDefault();
                }
              }}
            >
              <ChevronRight size={20} />
            </div>
          )}
        </div>
      </div>
      
      {products.length > 1 && (
        <div className="flex justify-center gap-1 pb-3">
          {products.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentIndex ? 'w-4 bg-gray-800' : 'w-1.5 bg-gray-300'
              }`}
              onClick={() => setCurrentIndex(i)}
              role="button"
              tabIndex={0}
              aria-label={`Go to slide ${i + 1}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setCurrentIndex(i);
                  e.preventDefault();
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}