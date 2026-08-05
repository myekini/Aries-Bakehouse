import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtNaira } from '../lib/format.js';
import { getVariantRules } from '../lib/catalog.js';
import { productImageFit, productImagePadding, productImageSource } from '../lib/media.js';
import { ingredientKindFor, variantColorFor } from '../lib/variantPresentation.js';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Card } from './ui/card.jsx';

const badgeVariant = {
  Bestseller: 'olive',
  New: 'caramel',
  Limited: 'muted',
  'Out of Stock': 'muted',
};

const CARD_VARIANT_KEY = {
  'banana-bread': 'toppings',
  brownies: 'flavours',
  cake: 'flavours',
};

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const canQuickAdd = !product.configurator && !product.outOfStock;
  const [previewImage, setPreviewImage] = useState(null);
  const [tapActive, setTapActive] = useState(false);
  const [swatches, setSwatches] = useState(null);
  const variantKey = CARD_VARIANT_KEY[product.configurator];
  const canSwatch = Boolean(variantKey);
  const imageSrc = productImageSource(product);

  useEffect(() => {
    if (!canSwatch) return;
    let cancelled = false;
    getVariantRules(product.slug, product.configurator).then((rules) => {
      if (!cancelled) setSwatches(rules?.[variantKey] || []);
    });
    return () => { cancelled = true; };
  }, [canSwatch, product.configurator, product.slug, variantKey]);

  function handleTapState() {
    if (!window.matchMedia('(hover: none)').matches) return;
    setTapActive(true);
    window.setTimeout(() => setTapActive(false), 900);
  }

  return (
    <Card
      className={`product-card${tapActive ? ' product-card--tapped' : ''}`}
      data-reveal-item
      onPointerDown={handleTapState}
      style={{ opacity: product.outOfStock ? 0.55 : 1 }}
    >
      <div
        className="product-card__image"
        style={{ padding: productImagePadding(product) }}
        onMouseLeave={() => setPreviewImage(null)}
      >
        <Link to={`/product/${product.slug}`} className="product-card__image-link" aria-label={`View ${product.name}`}>
          <img
            loading="lazy"
            src={previewImage || imageSrc}
            alt={product.name}
            onError={(event) => {
              if (event.currentTarget.src !== new URL(imageSrc, window.location.origin).href) {
                event.currentTarget.src = imageSrc;
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: previewImage ? 'cover' : productImageFit(product), borderRadius: productImagePadding(product) ? 8 : 0 }}
          />
        </Link>
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
              onClick={(e) => { e.preventDefault(); addToCart({ id: product.slug, name: product.name, price: product.startingPrice, image: imageSrc, productId: product.id, variantSelections: {} }); }}
              aria-label={`Quick add ${product.name} to cart`}
              className="product-card__quick-add"
            >+</Button>
          )}
      </div>
        {swatches && swatches.length > 0 && (
          <div
            className="product-card__swatches"
            aria-label={`Preview ${product.name} options`}
            onMouseLeave={() => setPreviewImage(null)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setPreviewImage(null);
            }}
          >
            {swatches.map((sw) => (
              <button
                key={sw.id}
                type="button"
                title={sw.label}
                aria-label={`Preview ${sw.label}`}
                aria-pressed={previewImage === sw.image}
                onMouseEnter={() => setPreviewImage(sw.image)}
                onFocus={() => setPreviewImage(sw.image)}
                onClick={() => setPreviewImage((current) => (current === sw.image ? null : sw.image))}
                className={previewImage === sw.image ? 'is-active' : ''}
              >
                <span
                  className="product-card__swatch-color"
                  style={{ background: variantColorFor(sw.id, sw.color) }}
                  aria-hidden="true"
                >
                  <span className={`swatch-picker__ingredient swatch-picker__ingredient--${ingredientKindFor(sw.id)}`} />
                </span>
              </button>
            ))}
          </div>
        )}
      <div className="product-card__body">
        <Link to={`/product/${product.slug}`} className="product-card__title">{product.name}</Link>
        <p className="product-card__description">{product.desc}</p>
        <div className="product-card__meta">
          <strong>
            {product.startingPrice === null ? 'Price TBC' : (product.priceFrom ? `From ${fmtNaira(product.startingPrice)}` : fmtNaira(product.startingPrice))}
          </strong>
          <span>{product.availability}</span>
        </div>
        {product.startingPrice === null && <p className="product-card__price-note">Price confirmed by the team before payment.</p>}
        <Link to={`/product/${product.slug}`} className="product-card__cta">
          {product.configurator ? 'Configure' : 'View details'} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </Card>
  );
}
