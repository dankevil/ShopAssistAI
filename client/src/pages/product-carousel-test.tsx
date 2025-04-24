import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ProductCarousel } from '@/components/ui/product-display';
import { Button } from '@/components/ui/button';

// Sample product data for testing
const sampleProducts = [
  {
    id: 1,
    title: "Serene Sofa Set",
    description: "Modular Sofa Set, a contemporary solution for dynamic living spaces.",
    price: "899.99",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    stockStatus: "In stock",
    url: "#"
  },
  {
    id: 2,
    title: "EcoZen Sofa",
    description: "EcoZen is a sustainable solution for modern living. This vegan leather sofa seamlessly transforms from day to night seating.",
    price: "1299.99",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    stockStatus: "In stock",
    url: "#"
  },
  {
    id: 3,
    title: "Zenith Bed",
    description: "Crafted with plush cushions and durable upholstery, it's perfect for lounging or entertaining guests for an overnight stay.",
    price: "1499.99",
    image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
    stockStatus: "Limited stock",
    url: "#"
  }
];

export default function ProductCarouselTest() {
  const [brandColor, setBrandColor] = useState('#4F46E5');

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Product Carousel Test</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Product Carousel Component</h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Brand Color:</label>
              <div className="flex gap-2">
                <Button onClick={() => setBrandColor('#4F46E5')} className="bg-indigo-600">Indigo</Button>
                <Button onClick={() => setBrandColor('#10B981')} className="bg-emerald-600">Emerald</Button>
                <Button onClick={() => setBrandColor('#F59E0B')} className="bg-amber-600">Amber</Button>
                <Button onClick={() => setBrandColor('#EC4899')} className="bg-pink-600">Pink</Button>
              </div>
            </div>
            
            <div className="border p-4 rounded-lg">
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Multiple Products</h3>
                <ProductCarousel products={sampleProducts} brandColor={brandColor} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Single Product</h3>
                <ProductCarousel products={[sampleProducts[0]]} brandColor={brandColor} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Chat Message Context</h2>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-white p-4 rounded-lg shadow-sm max-w-xl mx-auto">
              <p className="text-sm mb-4">Here are some sofa options that might interest you:</p>
              <ProductCarousel products={sampleProducts} brandColor={brandColor} />
              <div className="mt-4 text-right">
                <span className="text-xs text-gray-500">Was this helpful?</span>
                <div className="inline-flex gap-2 ml-2">
                  <Button variant="outline" size="sm" className="text-xs">👍 Yes</Button>
                  <Button variant="outline" size="sm" className="text-xs">👎 No</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}