import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtNaira } from '../lib/format.js';
import { getVariantRules } from '../lib/catalog.js';
import { productImageFit, productImagePadding } from '../lib/media.js';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card } from './ui/card.jsx';

const badgeVariant = {
  Bestseller: 'olive',
  New: 'caramel',
  Limited: 'muted',
  'Out of Stock': 'muted',
};

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const canQuickAdd = !product.configurator && !product.outOfStock;
  const [previewImage, setPreviewImage] = useState(null);
  // §6: "Hovering (desktop) / tapping (mobile) a topping swatch on the card
  // previews the variant image where available." Only one product in the
  // catalogue currently has this (banana bread), so fetching its variant
  // rows on mount isn't a meaningful N+1 concern the way fetching per-card
  // for a whole grid would be.
  const [swatches, setSwatches] = useState(null);
  const canSwatch = product.configurator === 'banana-bread';

  useEffect(() => {
    if (!canSwatch) return;
    let cancelled = false;
    getVariantRules(product.slug, 'banana-bread').then((rules) => { if (!cancelled) setSwatches(rules?.toppings || []); });
    return () => { cancelled = true; };
  }, [canSwatch, product.slug]);

  return (
    <Card style={{ padding: 14, opacity: product.outOfStock ? 0.55 : 1, display: 'flex', flexDirection: 'column' }}>
      <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div
          style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(180deg, var(--color-white), var(--color-cream))', padding: productImagePadding(product) }}
          onMouseLeave={() => setPreviewImage(null)}
        >
          <img loading="lazy" src={previewImage || product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: previewImage ? 'cover' : productImageFit(product), borderRadius: productImagePadding(product) ? 8 : 0 }} />
          {product.badge && (
            <Badge variant={badgeVariant[product.badge] || 'default'} style={{ position: 'absolute', top: 10, left: 10 }}>
              {product.badge}
            </Badge>
          )}
          {canQuickAdd && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); addToCart({ id: product.slug, name: product.name, price: product.startingPrice, image: product.image, productId: product.id, variantSelections: {} }); }}
              aria-label={`Quick add ${product.name} to cart`}
              style={{
                position: 'absolute', top: 8, right: 8, width: 32, height: 32,
                background: 'var(--color-white)', boxShadow: '0 4px 10px rgba(50,26,23,0.2)', fontSize: 16,
              }}
            >+</Button>
          )}
        </div>
        {swatches && swatches.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }} onMouseLeave={() => setPreviewImage(null)}>
            {swatches.map((sw) => (
              <span
                key={sw.id}
                title={sw.label}
                onMouseEnter={() => setPreviewImage(sw.image)}
                onTouchStart={() => setPreviewImage((cur) => (cur === sw.image ? null : sw.image))}
                onClick={(e) => e.preventDefault()}
                style={{
                  width: 14, height: 14, borderRadius: 999, background: sw.color,
                  border: '1px solid rgba(50,26,23,0.2)', cursor: 'pointer',
                  outline: previewImage === sw.image ? '2px solid var(--color-choc)' : 'none', outlineOffset: 1,
                }}
              />
            ))}
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>{product.name}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.desc}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            {product.startingPrice === null ? 'Price TBC' : (product.priceFrom ? `From ${fmtNaira(product.startingPrice)}` : fmtNaira(product.startingPrice))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-olive)', fontWeight: 700 }}>{product.availability}</div>
        </div>
      </Link>
    </Card>
  );
}
