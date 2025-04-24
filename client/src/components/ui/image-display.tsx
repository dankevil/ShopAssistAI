import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, X } from 'lucide-react';

interface ImageDisplayProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function ImageDisplay({ src, alt, caption, className = '' }: ImageDisplayProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`relative rounded-md overflow-hidden bg-gray-100 cursor-pointer ${className}`}>
        <img 
          src={src} 
          alt={alt}
          className="w-full h-auto object-cover transition-transform hover:scale-105"
          onClick={() => setOpen(true)}
          loading="lazy"
        />
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
            {caption}
          </div>
        )}
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] p-0">
          <div className="relative flex items-center justify-center h-full">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-50 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={src} 
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
          {caption && (
            <div className="p-4 text-center text-sm text-gray-700">
              {caption}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ZoomableImage({ src, alt, caption }: ImageDisplayProps) {
  const [scale, setScale] = useState(1);
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  
  return (
    <div className="relative w-full rounded-md overflow-hidden bg-gray-100">
      <div className="overflow-auto">
        <img 
          src={src} 
          alt={alt}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
          className="w-full h-auto object-contain transition-transform duration-200"
        />
      </div>
      
      {caption && (
        <div className="bg-gray-100 text-gray-800 p-2 text-sm text-center border-t border-gray-200">
          {caption}
        </div>
      )}
      
      <div className="absolute top-2 right-2 flex space-x-1">
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white"
          onClick={zoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white"
          onClick={zoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}