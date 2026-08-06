import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { fmtNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useProduct, useProductReviews, useRelatedProducts } from '../hooks/useCatalog.js';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PillSelector from '../components/PillSelector.jsx';
import SwatchPicker from '../components/SwatchPicker.jsx';
import ProductCard from '../components/ProductCard.jsx';
import BrowniesHeroQA from '../components/BrowniesHeroQA.jsx'; // DEV/QA ONLY — see that file's header before removing
import { productImageFit, productImagePadding } from '../lib/media.js';
import { trackEvent } from '../lib/analytics.js';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { product, rules, loading, error } = useProduct(slug);

  if (loading) {
    return (
      <div className="container" style={{ padding: '64px 0', display: 'flex', gap: 64, flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ flex: '1 1 400px', aspectRatio: '4/5' }} />
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 36, width: '70%' }} />
          <div className="skeleton" style={{ height: 22, width: '30%' }} />
          <div className="skeleton" style={{ height: 80 }} />
        </div>
      </div>
    );
  }
  if (error || !product) return <Navigate to="/menu" replace />;

  return <ProductDetailView slug={slug} product={product} rules={rules} />;
}

function ProductDetailView({ slug, product, rules }) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('aries11_recently_viewed');
      const slugs = raw ? JSON.parse(raw) : [];
      const next = [slug, ...slugs.filter((item) => item !== slug)].slice(0, 6);
      window.localStorage.setItem('aries11_recently_viewed', JSON.stringify(next));
    } catch (err) {
      console.error('Recently viewed save failed:', err);
    }
  }, [slug]);

  useEffect(() => {
    trackEvent('product_viewed', { productId: product.id, slug, name: product.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // `key={slug}` forces a remount on every product change — without it,
  // navigating from one product to a related one keeps the previous
  // product's configurator state (wrong variant ids for the new product,
  // which can crash the `.find()` lookups in each config below).
  switch (product.configurator) {
    case 'banana-bread': return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeBananaBreadConfig} />;
    case 'small-chops': return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeSmallChopsConfig} />;
    case 'brownies': return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeBrowniesConfig} />;
    case 'pastries': return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makePastriesConfig} />;
    case 'cake': return <ConfiguredProduct key={slug} product={product} rules={rules} makeConfig={makeCakeConfig} />;
    default: return <SimpleProduct key={slug} product={product} />;
  }
}

function ProductInfoBlock({ product }) {
  return (
    <div className="card product-info-panel">
      <InfoRow label="Ingredients" value={confirmedInfo(product?.ingredientsNote, 'Contact support for the current ingredient list.')} />
      <InfoRow label="Allergens" value={confirmedInfo(product?.allergenNote, 'Contact support before ordering if you have an allergy.')} />
      <InfoRow label="Storage" value={confirmedInfo(product?.storageNote, 'Storage guidance is provided with your order.')} />
    </div>
  );
}

function confirmedInfo(value, fallback) {
  return !value || value.trim().toUpperCase() === 'TBC' ? fallback : value;
}

function InfoRow({ label, value }) {
  return (
    <div className="product-info-row">
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function productCategoryLabel(category) {
  if (category === 'brownies-cookies') return 'Brownies';
  return category
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProductBreadcrumb({ product }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink render={<Link to="/menu" />}>Menu</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink render={<Link to={`/menu/${product.category}`} />}>{productCategoryLabel(product.category)}</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>{product.name}</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Related({ slug }) {
  const { data: related, loading } = useRelatedProducts(slug, 4);
  if (loading || !related || related.length === 0) return null;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Related Products</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {related.map((r) => <ProductCard key={r.slug} product={r} />)}
      </div>
    </div>
  );
}

function ProductGallery({ product, activeImage, alt }) {
  const images = useMemo(() => {
    const base = product.galleryImages?.length ? product.galleryImages : [{ url: product.image, alt: product.name }];
    const merged = [{ url: activeImage, alt }, ...base].filter((img) => img.url);
    return merged.filter((img, index) => merged.findIndex((x) => x.url === img.url) === index);
  }, [activeImage, alt, product.galleryImages, product.image, product.name]);
  const [selected, setSelected] = useState(activeImage || images[0]?.url);

  return (
    <div className="product-gallery">
      <div className="product-gallery__stage" style={{ padding: productImagePadding(product) }}>
        <AnimatePresence initial={false}>
          <motion.img
            key={selected}
            src={selected}
            alt={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="product-gallery__image"
            style={{ objectFit: productImageFit(product), padding: 'inherit' }}
          />
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div aria-label="Product image gallery" className="product-gallery__thumbs">
          {images.map((img) => (
            <button
              key={img.url}
              onClick={() => setSelected(img.url)}
              aria-label={`Show ${img.alt}`}
              className={selected === img.url ? 'is-active' : ''}
            >
              <img src={img.url} alt="" style={{ objectFit: productImageFit(product) }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfiguredPreview({ product, image, label }) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState({ image, label });

  useEffect(() => {
    if (!image || image === displayed.image) {
      // The preview label can change without an image transition.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (label !== displayed.label) setDisplayed((current) => ({ ...current, label }));
      return undefined;
    }

    let cancelled = false;
    const preview = new window.Image();
    const showPreview = () => {
      if (!cancelled) setDisplayed({ image, label });
    };
    preview.onload = showPreview;
    preview.src = image;
    if (preview.complete) showPreview();

    return () => {
      cancelled = true;
      preview.onload = null;
    };
  }, [displayed.image, displayed.label, image, label]);

  return (
    <div className="product-configurator__preview">
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={displayed.image}
          src={displayed.image}
          alt={displayed.label}
          fetchPriority="high"
          initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: reduceMotion ? 1 : 0, scale: 1.01 }}
          transition={{ duration: reduceMotion ? 0 : 0.28, ease: 'easeOut' }}
          style={{ objectFit: productImageFit(product), padding: productImagePadding(product) }}
        />
      </AnimatePresence>
      <div className="product-configurator__preview-label">
        <span>Your selection</span>
        <strong>{displayed.label}</strong>
      </div>
    </div>
  );
}

function DeliveryEstimate({ fulfilment, setFulfilment }) {
  return (
    <section className="product-fulfilment" aria-labelledby="fulfilment-title">
      <div className="product-fulfilment__heading"><span id="fulfilment-title">How would you like it?</span><small>Choose now; confirm details at checkout</small></div>
      <div className="product-fulfilment__options">
        <ToggleMini active={fulfilment === 'pickup'} onClick={() => setFulfilment('pickup')}>Pickup</ToggleMini>
        <ToggleMini active={fulfilment === 'delivery'} onClick={() => setFulfilment('delivery')}>Delivery</ToggleMini>
      </div>
      <p>
        {fulfilment === 'pickup'
          ? 'Pickup is available after the required 24-hour preparation window.'
          : 'Delivery is available after preparation. The team confirms the delivery fee after reviewing your address.'}
        {' '}<Link to="/delivery">Delivery details</Link>
      </p>
    </section>
  );
}

function ToggleMini({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'is-active' : ''}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function ProductReviews({ slug }) {
  const { data: reviews, loading } = useProductReviews(slug, 6);
  if (loading || !reviews || reviews.length === 0) return null;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>Reviews</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 700 }}>{average.toFixed(1)} / 5</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {reviews.map((review) => (
          <div key={review.id} className="card" style={{ padding: 22 }}>
            <div aria-label={`${review.rating} out of 5 stars`} style={{ color: 'var(--color-caramel)', fontSize: 15, fontWeight: 800 }}>
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </div>
            <div style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: 10 }}>&ldquo;{review.comment}&rdquo;</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileProductAction({ price, disabled = false, onAddToCart, onBuyNow }) {
  return (
    <div className="mobile-sticky-action">
      <div className="mobile-sticky-action__meta">
        <div className="mobile-sticky-action__label">Order total</div>
        <div className="mobile-sticky-action__price">{price}</div>
      </div>
      <button type="button" className="mobile-sticky-action__buy-now" disabled={disabled} onClick={onBuyNow}>Buy now</button>
      <button type="button" className="btn btn-primary" disabled={disabled} onClick={onAddToCart}>{disabled ? 'Out of stock' : 'Add to cart'}</button>
    </div>
  );
}

// ---- Simple (no-configurator) products ----
function SimpleProduct({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [fulfilment, setFulfilment] = useState('pickup');

  const item = () => ({ id: product.slug, name: product.name, price: product.startingPrice, qty, image: product.image, productId: product.id, variantSelections: {} });

  // Buy Now isolates to just this item — it must not touch whatever is
  // already sitting in the shared cart (spec §7: "skips cart, goes straight
  // to checkout with this item").
  function buyNow() {
    navigate('/checkout', { state: { buyNowItem: item() } });
  }

  return (
    <div className="product-page-with-sticky">
      <div className="container product-configurator__breadcrumb"><ProductBreadcrumb product={product} /></div>
      <div className="container product-configurator product-composer">
        <div className="product-configurator__media">
          <ProductGallery product={product} activeImage={product.image} alt={product.name} />
        </div>
        <div className="product-configurator__controls">
          <div className="product-configurator__category">{productCategoryLabel(product.category)}</div>
          <h1>{product.name}</h1>
          <div className="product-configurator__price">{product.startingPrice === null ? 'Price TBC' : fmtNaira(product.startingPrice)}</div>
          <p className="product-configurator__description">{product.desc}</p>
          <div className="product-configurator__availability">{product.availability}</div>
          {product.startingPrice === null && <PriceTbcNotice />}

          <div className="product-configurator__quantity">
            <div className="product-composer__section-label">Quantity</div>
            <QtyStepper qty={qty} setQty={setQty} min={1} />
          </div>

          <DeliveryEstimate fulfilment={fulfilment} setFulfilment={setFulfilment} />

          <PurchaseActions disabled={product.outOfStock} onAddToCart={() => addToCart(item())} onBuyNow={buyNow} />

          <ProductInfoBlock product={product} />
        </div>
      </div>
      <MobileProductAction
        price={product.startingPrice === null ? 'Price TBC' : fmtNaira(product.startingPrice * qty)}
        disabled={product.outOfStock}
        onAddToCart={() => addToCart(item(), { openDrawer: true })}
        onBuyNow={buyNow}
      />
      <ProductReviews slug={product.slug} />
      <Related slug={product.slug} />
    </div>
  );
}

function QtyStepper({ qty, setQty, min = 1 }) {
  return (
    <div className="product-quantity">
      <button type="button" aria-label="Decrease quantity" disabled={qty <= min} onClick={() => setQty(Math.max(min, qty - 1))}>&minus;</button>
      <div aria-live="polite">{qty}</div>
      <button type="button" aria-label="Increase quantity" onClick={() => setQty(qty + 1)}>+</button>
    </div>
  );
}

function PriceTbcNotice() {
  return <div className="product-price-notice" role="note"><strong>Price confirmation needed</strong><span>Add this item to your order now. The team will confirm its price on WhatsApp before online payment is available.</span></div>;
}

function PurchaseActions({ disabled, onAddToCart, onBuyNow }) {
  return <div className="product-configurator__actions"><button type="button" className="btn btn-primary btn-lg" disabled={disabled} onClick={onAddToCart}>{disabled ? 'Out of stock' : 'Add to cart'}</button><button type="button" className="product-buy-now" disabled={disabled} onClick={onBuyNow}>Buy now and continue to checkout</button></div>;
}

// ---- Configured products ----
// `makeConfig(rules)` builds a config object exposing: initialState(),
// image(state), unitPrice(state), itemName(product,state), note(state), and
// a Fields component — built fresh per product since `rules` now comes from
// an async fetch instead of a static import.

function ConfiguredProduct({ product, rules, makeConfig }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const config = useMemo(() => makeConfig(rules), [makeConfig, rules]);
  const [state, setState] = useState(() => config.initialState());
  const [fulfilment, setFulfilment] = useState('pickup');

  // Skips the initial mount (that's a view, not a selection) — every state
  // change after that is the customer picking a size/topping/flavour/etc.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    trackEvent('variant_selected', { productId: product.id, slug: product.slug, selections: state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const unitPrice = config.unitPrice(state);
  const qty = state.qty;
  const priceKnown = unitPrice !== null;

  const variantImage = config.image(state) || product.image;
  const previewLabel = config.previewLabel ? config.previewLabel(state) : config.itemName(product, state);

  const buildItem = () => {
    const { qty: _qty, ...variantSelections } = state; // qty isn't a variant selection
    return {
      id: `${product.slug}-${config.variantKey(state)}`,
      name: config.itemName(product, state),
      price: unitPrice,
      qty,
      image: variantImage,
      productId: product.id,
      variantSelections,
    };
  };

  // Buy Now isolates to just this item — see the identical note on
  // SimpleProduct's buyNow above.
  function buyNow() {
    navigate('/checkout', { state: { buyNowItem: buildItem() } });
  }

  return (
    <div className="product-page-with-sticky">
      <div className="container product-configurator__breadcrumb"><ProductBreadcrumb product={product} /></div>
      <div className="container product-configurator">
        <div className="product-configurator__media">
          <ConfiguredPreview product={product} image={variantImage} label={previewLabel} />
        </div>

        <div className="product-configurator__controls">
          <div className="product-configurator__category">{productCategoryLabel(product.category)}</div>
          <h1>{product.name}</h1>
          <div className="product-configurator__price">{priceKnown ? fmtNaira(unitPrice) : 'Price TBC'}</div>
          <p className="product-configurator__description">{product.desc}</p>
          <div className="product-configurator__availability">{product.availability}</div>
          {!priceKnown && <PriceTbcNotice />}

          <config.Fields state={state} setState={setState} />

          <div className="product-configurator__quantity">
            <div className="product-composer__section-label">Quantity</div>
            <QtyStepper qty={qty} setQty={(q) => setState((s) => ({ ...s, qty: q }))} min={config.minQty ? config.minQty(state) : 1} />
          </div>

          <DeliveryEstimate fulfilment={fulfilment} setFulfilment={setFulfilment} />

          <AnimatedTotal priceKnown={priceKnown} total={priceKnown ? unitPrice * qty : null} />

          <PurchaseActions onAddToCart={() => addToCart(buildItem())} onBuyNow={buyNow} />
          <div className="product-configurator__note">
            {config.note ? config.note(state) : null}
          </div>

          <ProductInfoBlock product={product} />
        </div>
      </div>
      <MobileProductAction
        price={priceKnown ? fmtNaira(unitPrice * qty) : 'Price TBC'}
        onAddToCart={() => addToCart(buildItem(), { openDrawer: true })}
        onBuyNow={buyNow}
      />
      {/* DEV/QA ONLY — remove this block (and BrowniesHeroQA.jsx) once a hero treatment is chosen */}
      {product.slug === 'brownie-box' && <BrowniesHeroQA />}
      <ProductReviews slug={product.slug} />
      <Related slug={product.slug} />
    </div>
  );
}

// The running total ticks over as selections change — the price responding
// instantly to each choice is what makes configuring feel like a
// conversation at the counter rather than a form.
function AnimatedTotal({ priceKnown, total }) {
  const reduceMotion = useReducedMotion();
  const text = priceKnown ? fmtNaira(total) : 'Price TBC';
  return (
    <div className="product-configurator__total">
      <div>Estimated total</div>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={text}
          initial={{ y: reduceMotion ? 0 : 14, opacity: reduceMotion ? 1 : 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduceMotion ? 0 : -14, opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ fontWeight: 800, fontSize: 24 }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function makeBananaBreadConfig(rules) {
  return {
    initialState: () => ({ size: 'medium', topping: 'plain', mixed: false, qty: 1 }),
    minQty: (state) => (rules.sizes.find((s) => s.id === state.size)?.minQty ?? 1),
    unitPrice: (state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      return state.mixed && size.mixedPrice ? size.mixedPrice : size.price;
    },
    image: (state) => (state.mixed ? rules.mixedImage : rules.toppings.find((t) => t.id === state.topping)?.image),
    previewLabel: (state) => (state.mixed ? 'Mixed toppings' : rules.toppings.find((t) => t.id === state.topping)?.label),
    variantKey: (state) => `${state.size}-${state.mixed ? 'mixed' : state.topping}`,
    itemName: (product, state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      const topping = state.mixed ? 'Mixed Toppings' : rules.toppings.find((t) => t.id === state.topping)?.label;
      return `${size.label} Banana Bread — ${topping}`;
    },
    note: (state) => (state.size === 'mini' ? `Minimum quantity: ${rules.sizes.find((s) => s.id === 'mini').minQty}` : null),
    Fields({ state, setState }) {
      const mixedAllowed = rules.mixedAllowedSizes.includes(state.size);
      const activeTopping = state.mixed ? null : rules.toppings.find((t) => t.id === state.topping);
      return (
        <>
          <div style={{ marginTop: 32 }}>
            <div className="product-composer__section-label">Size</div>
            <PillSelector ariaLabel="Size"
              options={rules.sizes.map((s) => ({ id: s.id, label: `${s.label} · ${fmtNaira(s.price)}` }))}
              value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size, mixed: rules.mixedAllowedSizes.includes(size) ? s.mixed : false, qty: Math.max(s.qty, rules.sizes.find((x) => x.id === size).minQty || 1) }))} />
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="product-composer__section-label">Topping</div>
              {mixedAllowed && (
                <button
                  type="button"
                  onClick={() => setState((s) => ({ ...s, mixed: !s.mixed }))}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: state.mixed ? 'var(--color-cocoa)' : 'var(--color-olive)', cursor: 'pointer' }}
                >
                  {state.mixed ? 'Mixed selected — clear' : 'Use mixed toppings (+₦500)'}
                </button>
              )}
            </div>
            <SwatchPicker ariaLabel="Topping" disabled={state.mixed}
              options={rules.toppings.map((t) => ({ id: t.id, label: t.label, image: t.icon || t.image, color: t.color }))}
              value={state.topping}
              onChange={(topping) => setState((s) => ({ ...s, topping }))} />
            <div aria-live="polite" style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10, minHeight: 20 }}>
              {state.mixed ? 'A mix of the kitchen’s toppings across the loaf.' : activeTopping ? `${activeTopping.label} — shown in the preview.` : null}
            </div>
          </div>
        </>
      );
    },
  };
}

function makeBrowniesConfig(rules) {
  return {
    initialState: () => ({ size: '4', flavour: 'biscoff', mixed: false, qty: 1 }),
    unitPrice: (state) => rules.sizes.find((s) => s.id === state.size)?.price,
    image: (state) => {
      if (state.mixed) return rules.sizes.find((s) => s.id === state.size)?.image;
      const flavourId = state.flavour.replaceAll('-', '');
      return `/uploads/aries11-brownies-box-${state.size}-${flavourId}.webp`;
    },
    previewLabel: (state) => {
      const size = rules.sizes.find((s) => s.id === state.size)?.label;
      const flavour = state.mixed ? 'Mixed flavours' : rules.flavours.find((f) => f.id === state.flavour)?.label;
      return `${size} · ${flavour}`;
    },
    variantKey: (state) => `${state.size}-${state.mixed ? 'mixed' : state.flavour}`,
    itemName: (product, state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      const flavour = state.mixed ? 'Mixed Flavours' : rules.flavours.find((f) => f.id === state.flavour)?.label;
      return `${size.label} Brownies — ${flavour}`;
    },
    Fields({ state, setState }) {
      return (
        <>
          <div style={{ marginTop: 32 }}>
            <div className="product-composer__section-label">Box Size</div>
            <PillSelector ariaLabel="Box size" options={rules.sizes.map((s) => ({ id: s.id, label: s.label }))} value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size }))} />
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="product-composer__section-label">Flavour</div>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, mixed: !s.mixed }))}
                style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: state.mixed ? 'var(--color-cocoa)' : 'var(--color-olive)', cursor: 'pointer' }}
              >
                {state.mixed ? 'Mixed selected — clear' : 'Mix flavours (same price)'}
              </button>
            </div>
            <SwatchPicker ariaLabel="Flavour" disabled={state.mixed} options={rules.flavours.map((f) => ({ id: f.id, label: f.label, image: f.icon || f.image }))} value={state.flavour}
              onChange={(flavour) => setState((s) => ({ ...s, flavour }))} />
          </div>
        </>
      );
    },
  };
}

function makePastriesConfig(rules) {
  return {
    initialState: () => ({ option: 'mixed', qty: 1 }),
    unitPrice: (state) => rules.options.find((o) => o.id === state.option)?.price,
    image: (state) => rules.options.find((o) => o.id === state.option)?.image,
    previewLabel: (state) => rules.options.find((o) => o.id === state.option)?.label,
    variantKey: (state) => state.option,
    itemName: (product, state) => rules.options.find((o) => o.id === state.option)?.label,
    note: () => rules.pieceCountNote,
    Fields({ state, setState }) {
      return (
          <div style={{ marginTop: 32 }}>
            <div className="product-composer__section-label">Selection</div>
          <SwatchPicker ariaLabel="Pastry selection" options={rules.options.map((o) => ({ id: o.id, label: o.label, image: o.icon || o.image }))} value={state.option}
            onChange={(option) => setState((s) => ({ ...s, option }))} />
        </div>
      );
    },
  };
}

function makeSmallChopsConfig(rules) {
  return {
    initialState: () => ({ platter: 'solo-survivor', qty: 1 }),
    unitPrice: (state) => rules.platters.find((p) => p.id === state.platter)?.price,
    image: (state) => rules.platters.find((p) => p.id === state.platter)?.image,
    previewLabel: (state) => rules.platters.find((p) => p.id === state.platter)?.label,
    variantKey: (state) => state.platter,
    itemName: (product, state) => rules.platters.find((p) => p.id === state.platter)?.label,
    note: () => 'Substitutions are not yet available — each platter is a fixed selection.',
    Fields({ state, setState }) {
      return (
          <div style={{ marginTop: 32 }}>
            <div className="product-composer__section-label">Platter</div>
          <SwatchPicker ariaLabel="Platter" options={rules.platters.map((p) => ({ id: p.id, label: p.label, image: p.icon || p.image }))} value={state.platter}
            onChange={(platter) => setState((s) => ({ ...s, platter }))} />
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10 }}>
            {rules.platters.find((p) => p.id === state.platter)?.desc}
          </div>
        </div>
      );
    },
  };
}

// Cake Parfait and Ice Cream Cake Twist share flavour/size option *shapes*
// but each product's own product_variant rows already carry that product's
// own photography (seeded separately per product), so no product-specific
// branching is needed here — unlike the earlier static-data version, which
// had to special-case "is this the Twist product" client-side.
function makeCakeConfig(rules) {
  return {
    initialState: () => ({ flavour: 'chocolate', size: 'small', qty: 1 }),
    unitPrice: () => null, // pricing TBC per spec §7
    image: (state) => rules.flavours.find((f) => f.id === state.flavour)?.image,
    previewLabel: (state) => {
      const flavour = rules.flavours.find((f) => f.id === state.flavour)?.label;
      const size = rules.sizes.find((s) => s.id === state.size)?.label;
      return `${flavour} · ${size}`;
    },
    variantKey: (state) => `${state.flavour}-${state.size}`,
    itemName: (product, state) => {
      const flavour = rules.flavours.find((f) => f.id === state.flavour)?.label;
      const size = rules.sizes.find((s) => s.id === state.size)?.label;
      return `${product.name} — ${flavour}, ${size}`;
    },
    note: () => rules.priceNote,
    Fields({ state, setState }) {
      return (
        <>
          <div style={{ marginTop: 32 }}>
            <div className="product-composer__section-label">Flavour</div>
            <SwatchPicker ariaLabel="Flavour" options={rules.flavours.map((f) => ({ id: f.id, label: f.label, image: f.icon || f.image }))} value={state.flavour}
              onChange={(flavour) => setState((s) => ({ ...s, flavour }))} />
          </div>
          <div style={{ marginTop: 28 }}>
            <div className="product-composer__section-label">Cup Size</div>
            <PillSelector ariaLabel="Cup size" options={rules.sizes.map((s) => ({ id: s.id, label: s.label }))} value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size }))} />
          </div>
        </>
      );
    },
  };
}
