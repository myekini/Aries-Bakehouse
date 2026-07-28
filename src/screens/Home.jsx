import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useCategories, useHomepageBestsellers, useHomepageFeatured, useHomepageReviews, useProduct } from '../hooks/useCatalog.js';
import { fmtNaira } from '../lib/format.js';
import ProductCard from '../components/ProductCard.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { productImageFit, productImagePadding } from '../lib/media.js';

const DEFAULT_PROMO = {
  active: true,
  eyebrow: 'This Month',
  title: 'Order a Cake Parfait bundle for your next gathering.',
  href: '/menu/cake-treats',
  cta: 'Browse Cake Treats',
};

export default function Home() {
  const { addToCart } = useCart();
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: featured, loading: featuredLoading } = useHomepageFeatured();
  const { data: bestsellers, loading: bestsellersLoading } = useHomepageBestsellers();
  const { data: reviews, loading: reviewsLoading } = useHomepageReviews(3);
  const [promo, setPromo] = useState(DEFAULT_PROMO);

  useEffect(() => {
    let cancelled = false;
    supabase.from('site_content').select('value').eq('key', 'promo_banner').maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setPromo({ ...DEFAULT_PROMO, ...data.value });
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      {/* CINEMATIC HERO — layout/copy only; motion treatment defined separately (§5) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48, padding: '80px 20px', minHeight: 680, background: 'var(--color-choc)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 64, padding: 0 }}>
          <div style={{ flex: '1 1 45%', minWidth: 320 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#EBC7A0', marginBottom: 18 }}>Aries 11 Bakehouse</div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.08, color: 'var(--color-white)', margin: 0 }}>
              Freshly Made Treats for Every <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: '#EBC7A0' }}>Craving</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,253,248,0.8)', lineHeight: 1.6, marginTop: 22, maxWidth: 440 }}>
              Fresh banana bread, pastries, brownies, cake treats and small-chops platters, made to order in Abeokuta.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap' }}>
              <Link to="/menu" className="btn" style={{ background: 'var(--color-white)', color: 'var(--color-choc)' }}>Explore the Menu</Link>
              <div style={{ alignSelf: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,253,248,0.72)' }}>24-hour preorder · Abeokuta</div>
            </div>
          </div>
          <div style={{ flex: '1 1 55%', minWidth: 320, position: 'relative' }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.35)' }}>
              <img src="/uploads/aries11-brand-collection-hero.png" alt="Assorted Aries 11 Bakehouse products" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED — loading skeleton / empty-fallback per spec §4/§5 */}
      <div className="container" style={{ padding: '96px 0 0' }}>
        <SectionHeading step="02" title="Featured" />
        {featuredLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="skeleton" style={{ height: 280 }} />
            <div className="skeleton" style={{ height: 280 }} />
          </div>
        ) : !featured || featured.length === 0 ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {featured.map((f, i) => (
            <div key={f.slug} className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40, padding: 28, flexDirection: i % 2 ? 'row-reverse' : 'row' }}>
              <div style={{ flex: '1 1 320px', aspectRatio: '16/10', borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(180deg, var(--color-white), var(--color-cream))', padding: productImagePadding(f) }}>
                <img loading="lazy" src={f.image} alt={f.name} style={{ width: '100%', height: '100%', objectFit: productImageFit(f), borderRadius: productImagePadding(f) ? 10 : 0 }} />
              </div>
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 10 }}>{f.tag}</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{f.name}</div>
                <div style={{ fontSize: 16, color: 'var(--color-text-muted)', marginTop: 10, lineHeight: 1.6, maxWidth: 420 }}>{f.desc}</div>
                <div style={{ fontWeight: 800, fontSize: 20, marginTop: 18 }}>{f.startingPrice === null ? 'Price TBC' : fmtNaira(f.startingPrice)}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                  {f.configurator ? (
                    <Link to={`/product/${f.slug}`} className="btn btn-primary">Configure</Link>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => addToCart({ id: f.slug, name: f.name, price: f.startingPrice, image: f.image, productId: f.id, variantSelections: {} }, { openDrawer: true })}
                    >
                      Add to Cart
                    </button>
                  )}
                  <Link to={`/product/${f.slug}`} style={{ textDecoration: 'none', color: 'var(--color-cocoa)', padding: '14px 10px', fontSize: 14, fontWeight: 700 }}>View Details &rarr;</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* CATEGORIES */}
      <div className="container" style={{ padding: '96px 0 0' }}>
        <SectionHeading step="03" title="Our Menu" />
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', marginBottom: 40, maxWidth: 480 }}>Six product families, freshly made every week.</p>
        {categoriesLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 240 }} />)}
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/menu/${cat.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', padding: 18, display: 'block' }}>
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', background: 'var(--color-cream)' }}>
                <img loading="lazy" src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 14 }}>{cat.name}</div>
              <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>{cat.desc}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-cocoa)', marginTop: 14 }}>View Menu &rarr;</div>
            </Link>
          ))}
        </div>
        )}
      </div>

      {/* BESTSELLERS */}
      <div className="container" style={{ padding: '96px 0 0' }}>
        <SectionHeading step="04" title="Bestsellers" />
        <p style={{ fontSize: 16, color: 'var(--color-text-muted)', marginBottom: 40, maxWidth: 480 }}>
          Hand-picked favourites — swapping to order-driven picks once we have live sales data.
        </p>
        {bestsellersLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {bestsellers.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
        )}
      </div>

      {/* PRODUCT-VARIANT CAROUSEL */}
      <div className="container" style={{ padding: '96px 0 0' }}>
        <SectionHeading step="05" title="Seven Toppings, One Loaf" />
        <VariantCarousel />
      </div>

      {/* BRAND STORY */}
      <div style={{ marginTop: 96, background: 'var(--color-choc)', padding: '96px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(28px, 4vw, 44px)', color: '#F3EBDD', maxWidth: 780, margin: '0 auto', lineHeight: 1.35 }}>
          Freshly made in Abeokuta. Beautifully packed for every occasion.
        </div>
      </div>

      {/* QUALITY MESSAGING */}
      <div className="container" style={{ padding: '80px 0' }}>
        <div style={{ textAlign: 'center', fontSize: 16, color: 'var(--color-text-muted)', margin: '0 auto 32px', maxWidth: 560 }}>
          Every order is prepared close to pickup or delivery, with clear timing before you pay.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
          <QualityItem label="Made to Order" />
          <QualityItem label="Real Ingredients" />
          <QualityItem label="24-Hour Preorder" />
        </div>
      </div>

      {!reviewsLoading && reviews && reviews.length > 0 && (
        <div className="container" style={{ padding: '0 0 80px' }}>
          <SectionHeading step="06" title="Customer Notes" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 28 }}>
            {reviews.map((review) => (
              <Link key={review.id} to={review.productSlug ? `/product/${review.productSlug}` : '/menu'} className="card" style={{ padding: 24, textDecoration: 'none', color: 'inherit' }}>
                <div aria-label={`${review.rating} out of 5 stars`} style={{ color: 'var(--color-caramel)', fontSize: 16, fontWeight: 800 }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 24, lineHeight: 1.25, marginTop: 12 }}>
                  "{review.comment}"
                </div>
                {review.productName && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-olive)', marginTop: 16 }}>{review.productName}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* DELIVERY + PROMO */}
      <div className="container" style={{ paddingBottom: 80, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 10 }}>Delivery &amp; Pickup</div>
          <div style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 340 }}>We deliver across Abeokuta, or you can pick up fresh from our kitchen.</div>
          <Link to="/delivery" style={{ display: 'inline-block', marginTop: 16, fontSize: 14, fontWeight: 700, color: 'var(--color-cocoa)' }}>See delivery details &rarr;</Link>
        </div>
        {promo.active && (
          <div style={{ background: 'var(--color-cocoa)', borderRadius: 20, padding: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#EBC7A0', marginBottom: 10 }}>{promo.eyebrow}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-white)', maxWidth: 340 }}>{promo.title}</div>
            <Link to={promo.href || '/menu'} style={{ display: 'inline-block', marginTop: 16, fontSize: 14, fontWeight: 700, color: '#F3EBDD' }}>{promo.cta || 'Browse Menu'} &rarr;</Link>
          </div>
        )}
      </div>

      {/* NEWSLETTER */}
      <div className="container" style={{ paddingBottom: 96 }}>
        <NewsletterCard />
      </div>
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
      <div style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800 }}>{title}</div>
    </div>
  );
}

function VariantCarousel() {
  const { rules, loading } = useProduct('signature-banana-bread');
  const toppings = rules?.toppings || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (toppings.length === 0) return;
    // §12: rotating/motion sections must respect prefers-reduced-motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % toppings.length), 2600);
    return () => clearInterval(timer);
  }, [toppings.length]);

  if (loading) return <div className="skeleton" style={{ height: 340 }} />;
  if (toppings.length === 0) return null;
  const active = toppings[index];

  return (
    <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'center', padding: 32 }}>
      <div style={{ flex: '0 0 280px', width: '100%', maxWidth: 340, aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden' }}>
        <img loading="lazy" src={active.image} alt={`Banana bread with ${active.label} topping`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.4s' }} />
      </div>
      <div style={{ flex: '1 1 280px' }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{active.label}</div>
        <div style={{ fontSize: 15, color: 'var(--color-text-muted)', marginTop: 10, maxWidth: 380, lineHeight: 1.6 }}>
          Every loaf starts with ripe banana and brown butter. Pick a topping, or ask for a mix.
        </div>
        <div role="tablist" aria-label="Topping" style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          {toppings.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === index}
              aria-label={t.label}
              onClick={() => setIndex(i)}
              style={{
                width: 12, height: 12, borderRadius: 999, border: '1px solid rgba(50,26,23,0.2)', cursor: 'pointer', padding: 0,
                background: i === index ? 'var(--color-choc)' : t.color,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function QualityItem({ label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#321A17" strokeWidth="1.4" strokeLinecap="round" style={{ margin: '0 auto 14px', display: 'block' }}>
        <circle cx="12" cy="12" r="8" /><path d="M12 8 L12 12 L15 14" />
      </svg>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
    </div>
  );
}

function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | submitted | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('saving');
    // A duplicate email hitting the unique constraint still reads as success
    // to the visitor — resubscribing shouldn't look like an error.
    const { error } = await supabase.from('newsletter_signup').insert({ email: email.trim() });
    setStatus(error && error.code !== '23505' ? 'error' : 'submitted');
  }

  return (
    <div className="card" style={{ padding: 48, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700 }}>Never miss a fresh batch.</div>
        <div style={{ fontSize: 15, color: 'var(--color-text-muted)', marginTop: 8, maxWidth: 400 }}>Get reorder reminders by email or WhatsApp — no spam, just fresh bread.</div>
      </div>
      {status === 'submitted' ? (
        <div style={{ fontWeight: 700, color: 'var(--color-olive)' }}>Thanks — we'll be in touch.</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flex: '0 1 380px' }}>
          <label htmlFor="newsletter-email" className="visually-hidden">Email address</label>
          <input id="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={{ flex: 1, borderRadius: 999 }} />
          <button type="submit" className="btn btn-primary" aria-busy={status === 'saving'} disabled={status === 'saving'} style={{ whiteSpace: 'nowrap' }}>Subscribe</button>
        </form>
      )}
      {status === 'error' && <div role="alert" style={{ fontSize: 12, color: 'var(--color-error)', width: '100%' }}>Could not subscribe — please try again.</div>}
    </div>
  );
}
