'use client';

import { useState, useEffect, useCallback } from 'react';

const productData = {
  wristband: {
    name: 'Smart Safety Wristband',
    tagline: 'The personal guardian for the ones you love most.',
    description: `The Back2Me Smart Safety Wristband is engineered for one purpose: bringing your loved ones back to you. Made from hypoallergenic, medical-grade silicone, each wristband features a permanently laser-engraved QR code that links directly to your secure Back2Me profile.

When someone scans the QR code with any smartphone camera — no app required — they have two instant ways to reach you: an anonymous phone call where both numbers stay completely hidden, or a real-time secure chat through our platform. Either way, you receive an immediate alert with the exact GPS location of the scan, and the reunion process begins.

One of the most powerful features of the wristband is the ability to store critical medical information directly on your profile. Parents can list allergies, medications, blood type, or any essential health data that a finder or first responder might need in an emergency. This information is displayed instantly when the QR code is scanned — no searching, no guessing, no wasted time.

Designed for comfort during all-day wear, the wristband is waterproof, sweat-resistant, and built to withstand the energy of active kids and the daily life of elderly family members. The adjustable strap fits wrists of all sizes, from toddlers to adults.`,
    features: [
      'Medical-grade hypoallergenic silicone',
      'Permanently laser-engraved QR code',
      'Two contact methods: anonymous phone call or platform chat',
      'Store critical medical info — allergies, medications, blood type',
      'Both phone numbers stay fully anonymous',
      'Waterproof & sweat-resistant',
      'Adjustable strap — fits toddlers to adults',
      'No batteries, no charging, no apps needed',
      'Works with any smartphone camera worldwide',
      'Real-time GPS scan alerts'
    ],
    idealFor: 'Children at theme parks, beaches, airports, and shopping malls. Elderly with Alzheimer\'s or dementia. Festival and concert-goers who want a trusted emergency contact on their wrist in case they need help. Anyone who needs an extra layer of safety.',
    images: [
      '/products/bluewristband.jpeg',
      '/products/orangewristbandpng.png',
      '/products/foto11.JPG',
      '/products/foto12.JPG',
      '/products/foto13.JPG',
      '/products/foto14.JPG'
    ],
    colors: ['Navy Blue', 'Vibrant Orange', '', '', '', '']
  },
  pettag: {
    name: 'Smart Pet Tag',
    tagline: 'Don\'t let your best friend become just a memory.',
    description: `The Back2Me Smart Pet Tag is the silent guardian your furry family member deserves. Unlike traditional pet ID tags that jingle, scratch, and fade over time, our tags are crafted from durable, scratch-resistant silicone with a laser-engraved QR code that never wears off.

When someone finds your lost pet, they simply scan the tag with their phone — no app download needed. The finder can reach you two ways: through an anonymous phone call where both numbers remain completely hidden, or via our secure real-time chat platform. You get an immediate notification with the exact GPS location where your pet was found.

A standout feature of the Smart Pet Tag is the ability to store your pet's medical information on your Back2Me profile. Veterinary needs, allergy lists, medication schedules, and special care instructions are all displayed instantly when the tag is scanned — giving the finder everything they need to keep your pet safe until they're back in your arms.

The tag attaches silently to any collar with a reinforced stainless steel ring. It won't rattle against water bowls, it won't snag on furniture, and it won't irritate sensitive pets. Available in high-visibility orange and deep navy blue, ensuring your pet stands out — or blends in — wherever they roam.`,
    features: [
      'Silent design — no jingling or rattling',
      'Scratch-resistant, waterproof silicone',
      'Permanently laser-engraved QR code',
      'Two contact methods: anonymous phone call or platform chat',
      'Store pet medical info — allergies, medications, vet details',
      'Both phone numbers stay fully anonymous',
      'Reinforced stainless steel attachment ring',
      'Works with any smartphone — no app needed',
      'Instant scan alerts with GPS location',
      'Fits all collar sizes for dogs and cats'
    ],
    idealFor: 'Dogs, cats, and any pet that wears a collar. Especially valuable for pets that escape easily, newly adopted animals, pets with medical conditions, or pets in unfamiliar environments during travel.',
    images: [
      '/products/orangepettag.png',
      '/products/bluepettag.png',
      '/products/foto1.PNG',
      '/products/foto2.PNG',
      '/products/foto 3.PNG'
    ],
    colors: ['Vibrant Orange', 'Navy Blue', '', '', '']
  },
  luggagetag: {
    name: 'Smart Luggage Tag',
    tagline: 'Your entire life is in that bag. Protect it globally.',
    description: `The Back2Me Smart Luggage Tag is built for the brutal reality of modern travel. Crafted from thick, reinforced silicone and secured with a reinforced stainless steel ring, this tag survives the conveyor belts, overhead bins, and baggage handlers that destroy ordinary luggage tags.

Each tag features a large, highly scannable QR code laser-engraved into the surface — it will never peel, fade, or scratch off. When someone finds your lost luggage, they scan the code with any smartphone and can reach you two ways: an anonymous phone call where both numbers stay completely hidden, or through our secure real-time chat platform. You receive an instant notification with the exact GPS coordinates of the scan.

The executive design comes in two striking colors and fits any bag, backpack, instrument case, camera bag, or travel gear. The stainless steel ring attachment ensures the tag stays locked on through any journey, anywhere in the world.`,
    features: [
      'Thick, reinforced silicone construction',
      'Reinforced stainless steel ring attachment — never falls off',
      'Extra-large laser-engraved QR code for easy scanning',
      'Two contact methods: anonymous phone call or platform chat',
      'Both phone numbers stay fully anonymous',
      'Survives conveyor belts, rain, and extreme handling',
      'Works with any smartphone — no app needed',
      'Real-time scan alerts with GPS coordinates',
      'Executive design for professional travelers'
    ],
    idealFor: 'Frequent flyers, digital nomads, touring musicians, photographers, families traveling with kids, and anyone who checks luggage or carries valuable gear.',
    images: [
      '/products/orangeluggagetag.png',
      '/products/blueluggagetag.png',
      '/products/foto8.PNG',
      '/products/foto9.PNG',
      '/products/foto10.PNG'
    ],
    colors: ['(Front)', '(Back)', '', '', '']
  },
  sticker: {
    name: 'Smart QR Stickers',
    tagline: 'Invisible armor for everything you carry.',
    description: `The Back2Me Smart QR Stickers are the most versatile product in the Back2Me ecosystem. These premium vinyl stickers are coated with a waterproof, UV-resistant, scratch-resistant laminate that keeps them looking pristine — and fully scannable — for years.

Each sticker features a unique QR code that links to your secure Back2Me profile. Stick them on your laptop, phone case, water bottle, drone, surfboard, skateboard, helmet, passport holder, camera, or literally anything you don't want to lose. When someone finds your item, one scan from any smartphone connects them to you instantly — via anonymous phone call or secure platform chat.

Stickers are sold individually and are available in two sizes: 1×1 inch for compact, discreet placement on smaller items, and 2×2 inch for maximum visibility on larger surfaces. The industrial-grade adhesive bonds permanently to any smooth surface without leaving residue if removed. They're thin, flat, and designed to be as discreet or visible as you want them to be.`,
    features: [
      'Premium waterproof vinyl with UV protection',
      'Scratch-resistant laminate coating',
      'Industrial-grade adhesive — stays put for years',
      'Available in two sizes: 1×1 in and 2×2 in (sold individually)',
      'Two contact methods: anonymous phone call or platform chat',
      'Both phone numbers stay fully anonymous',
      'Works on any smooth surface',
      'Each sticker has a unique scannable QR code',
      'No app needed — works with any smartphone camera',
      'Thin, flat profile — barely noticeable'
    ],
    idealFor: 'Laptops, tablets, phone cases, drones, cameras, surfboards, skateboards, helmets, water bottles, passport holders, instrument cases, and any valuable item you carry daily.',
    images: [
      '/products/blueticker.png',
      '/products/orangesticker.png',
      '/products/foto4.PNG',
      '/products/foto5.PNG',
      '/products/foto6.PNG',
      '/products/foto7.PNG'
    ],
    colors: ['Navy Blue', 'Vibrant Orange', '', '', '', '']
  }
};

export default function ProductModal({ productKey, isOpen, onClose }) {
  const [activeImage, setActiveImage] = useState(0);
  const product = productData[productKey];

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    setActiveImage(0);
  }, [productKey]);

  if (!isOpen || !product) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="product-modal-body">
          {/* Left: Image Gallery */}
          <div className="product-modal-gallery">
            <div className="product-modal-main-image">
              <img src={product.images[activeImage]} alt={product.name} />
            </div>
            <div className="product-modal-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`product-modal-thumb ${activeImage === i ? 'active' : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt={`${product.name} - ${product.colors[i] || 'Image'}`} />
                  {product.colors[i] && <span className="thumb-label">{product.colors[i]}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="product-modal-details">
            <span className="product-modal-badge">Back2Me Global</span>
            <h2 className="product-modal-title">{product.name}</h2>
            <p className="product-modal-tagline">{product.tagline}</p>

            <div className="product-modal-description">
              {product.description.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <div className="product-modal-features">
              <h3>Key Features</h3>
              <ul>
                {product.features.map((feature, i) => (
                  <li key={i}>
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="product-modal-ideal">
              <h3>Ideal For</h3>
              <p>{product.idealFor}</p>
            </div>

            <div className="product-modal-cta">
              <button className="btn btn-orange">Shop Now</button>
              <span className="product-modal-note">Free shipping on orders over $15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { productData };
