'use client';

import { Link } from 'react-router-dom';
import { useCategories, useHomepageFeatured } from '../hooks/useCatalog.js';
import ProductCard from '../components/ProductCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import ScrollRevealGroup from '../components/ScrollRevealGroup.jsx';
import OrderingWorks from '../components/OrderingWorks.jsx';
import CounterRail from '../components/CounterRail.jsx';
import SignatureLoafSpotlight from '../components/SignatureLoafSpotlight.jsx';
import CounterScroller from '../components/CounterScroller.jsx';
import { Button } from '../components/ui/button.jsx';

// `categories`/`featured`, when passed, are server-fetched by
// src/app/page.jsx under ISR — see the `initial` param comment in
// useCatalog.js for why that skips the client fetch these hooks would
// otherwise do.
export default function Home({ categories: initialCategories, featured: initialFeatured } = {}) {
  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { data: featured, loading: featuredLoading } = useHomepageFeatured(initialFeatured);

  return (
    <div className="home-page">
      <HeroCarousel />

      {categoriesLoading ? (
        <div className="container category-showcase__loading" aria-label="Loading menu categories">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton" />
          ))}
        </div>
      ) : (
        <CounterRail categories={categories} />
      )}

      <SignatureLoafSpotlight />

      <CounterScroller />

      <section className="container home-section" aria-labelledby="featured-title">
        <div className="home-section__header">
          <div>
            <p className="home-section__kicker">From the kitchen</p>
            <h2 id="featured-title">Fresh picks</h2>
            <p>Made-to-order favourites for a thoughtful treat or an easy gathering.</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/menu">View full menu</Link>
          </Button>
        </div>

        {featuredLoading ? (
          <div className="home-product-grid" aria-label="Loading featured products">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton home-product-grid__skeleton" />
            ))}
          </div>
        ) : featured?.length > 0 ? (
          <ScrollRevealGroup className="home-product-grid">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </ScrollRevealGroup>
        ) : null}
      </section>

      <OrderingWorks />
    </div>
  );
}
