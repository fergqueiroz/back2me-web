'use client';

import { useState } from 'react';
import ProductModal from './ProductModal';

export default function ProductsShowcase() {
  const [activeProduct, setActiveProduct] = useState(null);

  const products = [
    {
      key: 'wristband',
      name: 'Smart Safety Wristband',
      shortDesc: 'Comfortable, durable silicone wristbands designed for kids and elderly. Connect to family with a single scan.',
      images: ['/products/bluewristband.jpeg', '/products/orangewristbandpng.png']
    },
    {
      key: 'pettag',
      name: 'Smart Pet Tag',
      shortDesc: 'Silent, scratch-resistant, and high-visibility pet tags. Ensure your best friend is always safe.',
      images: ['/products/orangepettag.png', '/products/bluepettag.png']
    },
    {
      key: 'luggagetag',
      name: 'Smart Luggage Tag',
      shortDesc: 'Protect your gear wherever you travel. Sleek, tough design for backpacks, instrument cases, and luggage.',
      images: ['/products/orangeluggagetag.png', '/products/blueluggagetag.png']
    },
    {
      key: 'sticker',
      name: 'Smart QR Stickers',
      shortDesc: 'Versatile, waterproof stickers. High-impact visibility for helmets, laptops, surfboards, and daily valuables.',
      images: ['/products/blueticker.png', '/products/orangesticker.png']
    }
  ];

  return (
    <>
      <div className="products-grid">
        {products.map((product) => (
          <div
            key={product.key}
            className="product-display product-clickable"
            onClick={() => setActiveProduct(product.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveProduct(product.key)}
          >
            <div className="image-swap-container">
              <img src={product.images[0]} alt={`${product.name} - Primary`} />
              <img src={product.images[1]} className="img-hover" alt={`${product.name} - Alternate`} />
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p>{product.shortDesc}</p>
              <span className="product-view-details">View Details →</span>
            </div>
          </div>
        ))}
      </div>

      <ProductModal
        productKey={activeProduct}
        isOpen={activeProduct !== null}
        onClose={() => setActiveProduct(null)}
      />
    </>
  );
}
