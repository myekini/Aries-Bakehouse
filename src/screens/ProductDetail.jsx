import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { fmtNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useProduct, useProductReviews, useRelatedProducts } from '../hooks/useCatalog.js';
import PillSelector from '../components/PillSelector.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { productImageFit, productImagePadding } from '../lib/media.js';
import { trackEvent } from '../lib/analytics.js';

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
    <div className="card" style={{ padding: 24, marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <InfoRow label="Ingredients" value={product?.ingredientsNote || 'TBC'} />
      <InfoRow label="Allergens" value={product?.allergenNote || 'TBC'} />
      <InfoRow label="Storage" value={product?.storageNote || 'TBC'} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <div style={{ fontWeight: 700, color: 'var(--color-olive)' }}>{label}</div>
      <div style={{ color: 'var(--color-text-muted)' }}>{value}</div>
    </div>
  );
}

function Breadcrumb({ product }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginBottom: 24 }}>
      <Link to="/menu" style={{ color: 'inherit', textDecoration: 'none' }}>Menu</Link>
      {' → '}
      <Link to={`/menu/${product.category}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.category.replace(/-/g, ' ')}</Link>
      {' → '}
      <span style={{ color: 'var(--color-choc)', fontWeight: 700 }}>{product.name}</span>
    </div>
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

  useEffect(() => {
    setSelected(activeImage || images[0]?.url);
  }, [activeImage, images]);

  return (
    <div>
      <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 20px rgba(50,26,23,0.1)', background: 'linear-gradient(180deg, var(--color-white), var(--color-cream))', padding: productImagePadding(product) }}>
        <img src={selected} alt={alt} style={{ width: '100%', height: '100%', objectFit: productImageFit(product), borderRadius: productImagePadding(product) ? 14 : 0 }} />
      </div>
      {images.length > 1 && (
        <div aria-label="Product image gallery" style={{ display: 'flex', gap: 10, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {images.map((img) => (
            <button
              key={img.url}
              onClick={() => setSelected(img.url)}
              aria-label={`Show ${img.alt}`}
              style={{
                flex: '0 0 64px', width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                border: selected === img.url ? '2px solid var(--color-choc)' : '1px solid rgba(50,26,23,0.14)',
                padding: 0, background: 'var(--color-white)', cursor: 'pointer',
              }}
            >
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: productImageFit(product) }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryEstimate({ fulfilment, setFulfilment }) {
  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: 'rgba(105,112,74,0.1)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <ToggleMini active={fulfilment === 'pickup'} onClick={() => setFulfilment('pickup')}>Pickup</ToggleMini>
        <ToggleMini active={fulfilment === 'delivery'} onClick={() => setFulfilment('delivery')}>Delivery</ToggleMini>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-cocoa)', lineHeight: 1.55 }}>
        {fulfilment === 'pickup'
          ? 'Ready for pickup from tomorrow after order confirmation.'
          : 'Delivery available from tomorrow after order confirmation; fee is confirmed at checkout.'}
        {' '}See <Link to="/delivery" style={{ color: 'inherit', fontWeight: 700 }}>delivery details</Link>.
      </div>
    </div>
  );
}

function ToggleMini({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: '9px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: active ? 'var(--color-choc)' : 'var(--color-white)',
        color: active ? 'var(--color-white)' : 'var(--color-choc)',
        fontSize: 12, fontWeight: 800,
      }}
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
            <div style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.6, marginTop: 10 }}>"{review.comment}"</div>
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
      <button className="btn btn-secondary" disabled={disabled} onClick={onBuyNow}>Buy Now</button>
      <button className="btn btn-primary" disabled={disabled} onClick={onAddToCart}>{disabled ? 'Out' : 'Add'}</button>
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
      <div className="container" style={{ padding: '24px 0 0' }}><Breadcrumb product={product} /></div>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 64, paddingBottom: 64 }}>
        <div style={{ flex: '1 1 400px' }}>
          <ProductGallery product={product} activeImage={product.image} alt={product.name} />
        </div>
        <div style={{ flex: '1 1 360px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-olive)' }}>{product.category.replace(/-/g, ' ')}</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 0' }}>{product.name}</h1>
          <div style={{ fontWeight: 800, fontSize: 22, marginTop: 12 }}>{fmtNaira(product.startingPrice)}</div>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', marginTop: 14, lineHeight: 1.6, maxWidth: 460 }}>{product.desc}</p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-olive)', marginTop: 10 }}>{product.availability}</div>

          <div style={{ marginTop: 28 }}>
            <div style={sectionLabel}>Quantity</div>
            <QtyStepper qty={qty} setQty={setQty} min={1} />
          </div>

          <DeliveryEstimate fulfilment={fulfilment} setFulfilment={setFulfilment} />

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={product.outOfStock} onClick={() => addToCart(item())}>
              {product.outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} disabled={product.outOfStock} onClick={buyNow}>
              Buy Now
            </button>
          </div>

          <ProductInfoBlock product={product} />
        </div>
      </div>
      <MobileProductAction
        price={fmtNaira(product.startingPrice * qty)}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(min, qty - 1))} style={qtyBtn}>&minus;</button>
      <div style={{ fontWeight: 800, fontSize: 18, minWidth: 24, textAlign: 'center' }}>{qty}</div>
      <button aria-label="Increase quantity" onClick={() => setQty(qty + 1)} style={qtyBtn}>+</button>
    </div>
  );
}

const qtyBtn = { width: 40, height: 40, borderRadius: 999, background: 'var(--color-white)', border: '1.5px solid var(--color-choc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, cursor: 'pointer' };
const sectionLabel = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 12 };

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
      <div className="container" style={{ padding: '24px 0 0' }}><Breadcrumb product={product} /></div>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 64, paddingBottom: 64 }}>
        <div style={{ flex: '1 1 400px' }}>
          <ProductGallery product={product} activeImage={variantImage} alt={config.itemName(product, state)} />
          <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginTop: 12, textAlign: 'center' }}>Preview updates with your selection.</div>
        </div>

        <div style={{ flex: '1 1 360px', position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-olive)' }}>{product.category.replace(/-/g, ' ')}</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 0' }}>{product.name}</h1>
          <div style={{ fontWeight: 800, fontSize: 22, marginTop: 12 }}>{priceKnown ? fmtNaira(unitPrice) : 'Price TBC'}</div>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)', marginTop: 14, lineHeight: 1.6, maxWidth: 460 }}>{product.desc}</p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-olive)', marginTop: 10 }}>{product.availability}</div>

          <config.Fields state={state} setState={setState} />

          <div style={{ marginTop: 28 }}>
            <div style={sectionLabel}>Quantity</div>
            <QtyStepper qty={qty} setQty={(q) => setState((s) => ({ ...s, qty: q }))} min={config.minQty ? config.minQty(state) : 1} />
          </div>

          <DeliveryEstimate fulfilment={fulfilment} setFulfilment={setFulfilment} />

          <div style={{ marginTop: 24, background: 'var(--color-white)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 600 }}>Estimated Total</div>
            <div style={{ fontWeight: 800, fontSize: 24 }}>{priceKnown ? fmtNaira(unitPrice * qty) : 'Price TBC'}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => addToCart(buildItem())}>Add to Cart</button>
            <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={buyNow}>Buy Now</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 10, textAlign: 'center' }}>
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
      <ProductReviews slug={product.slug} />
      <Related slug={product.slug} />
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
    variantKey: (state) => `${state.size}-${state.mixed ? 'mixed' : state.topping}`,
    itemName: (product, state) => {
      const size = rules.sizes.find((s) => s.id === state.size);
      const topping = state.mixed ? 'Mixed Toppings' : rules.toppings.find((t) => t.id === state.topping)?.label;
      return `${size.label} Banana Bread — ${topping}`;
    },
    note: (state) => (state.size === 'mini' ? `Minimum quantity: ${rules.sizes.find((s) => s.id === 'mini').minQty}` : null),
    Fields({ state, setState }) {
      const mixedAllowed = rules.mixedAllowedSizes.includes(state.size);
      return (
        <>
          <div style={{ marginTop: 32 }}>
            <div style={sectionLabel}>Size</div>
            <PillSelector ariaLabel="Size" options={rules.sizes.map((s) => ({ id: s.id, label: s.label }))} value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size, mixed: rules.mixedAllowedSizes.includes(size) ? s.mixed : false, qty: Math.max(s.qty, rules.sizes.find((x) => x.id === size).minQty || 1) }))} />
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={sectionLabel}>Topping</div>
              {mixedAllowed && (
                <button
                  onClick={() => setState((s) => ({ ...s, mixed: !s.mixed }))}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: state.mixed ? 'var(--color-cocoa)' : 'var(--color-olive)', cursor: 'pointer' }}
                >
                  {state.mixed ? 'Mixed selected — clear' : 'Use mixed toppings (+₦500)'}
                </button>
              )}
            </div>
            <PillSelector ariaLabel="Topping" disabled={state.mixed} options={rules.toppings.map((t) => ({ id: t.id, label: t.label }))} value={state.topping}
              onChange={(topping) => setState((s) => ({ ...s, topping }))} />
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
    image: (state) => rules.sizes.find((s) => s.id === state.size)?.image,
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
            <div style={sectionLabel}>Box Size</div>
            <PillSelector ariaLabel="Box size" options={rules.sizes.map((s) => ({ id: s.id, label: s.label }))} value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size }))} />
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={sectionLabel}>Flavour</div>
              <button
                onClick={() => setState((s) => ({ ...s, mixed: !s.mixed }))}
                style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: state.mixed ? 'var(--color-cocoa)' : 'var(--color-olive)', cursor: 'pointer' }}
              >
                {state.mixed ? 'Mixed selected — clear' : 'Mix flavours (same price)'}
              </button>
            </div>
            <PillSelector ariaLabel="Flavour" disabled={state.mixed} options={rules.flavours.map((f) => ({ id: f.id, label: f.label }))} value={state.flavour}
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
    variantKey: (state) => state.option,
    itemName: (product, state) => rules.options.find((o) => o.id === state.option)?.label,
    note: () => rules.pieceCountNote,
    Fields({ state, setState }) {
      return (
        <div style={{ marginTop: 32 }}>
          <div style={sectionLabel}>Selection</div>
          <PillSelector ariaLabel="Pastry selection" options={rules.options.map((o) => ({ id: o.id, label: o.label }))} value={state.option}
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
    variantKey: (state) => state.platter,
    itemName: (product, state) => rules.platters.find((p) => p.id === state.platter)?.label,
    note: () => 'Substitutions are not yet available — each platter is a fixed selection.',
    Fields({ state, setState }) {
      return (
        <div style={{ marginTop: 32 }}>
          <div style={sectionLabel}>Platter</div>
          <PillSelector ariaLabel="Platter" options={rules.platters.map((p) => ({ id: p.id, label: p.label }))} value={state.platter}
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
            <div style={sectionLabel}>Flavour</div>
            <PillSelector ariaLabel="Flavour" options={rules.flavours.map((f) => ({ id: f.id, label: f.label }))} value={state.flavour}
              onChange={(flavour) => setState((s) => ({ ...s, flavour }))} />
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={sectionLabel}>Cup Size</div>
            <PillSelector ariaLabel="Cup size" options={rules.sizes.map((s) => ({ id: s.id, label: s.label }))} value={state.size}
              onChange={(size) => setState((s) => ({ ...s, size }))} />
          </div>
        </>
      );
    },
  };
}
