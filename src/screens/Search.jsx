import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search as SearchIcon, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../components/ui/input-group.jsx';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const { data: products, loading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(input ? { q: input } : {}, { replace: true });
      if (input.trim().length >= 2) trackEvent('search_performed', { query: input.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [input, setParams]);

  const query = input.trim();
  const results = useMemo(() => {
    if (query.length < 2 || !products) return [];
    const normalized = query.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(normalized)
      || product.category.includes(normalized)
      || product.desc?.toLowerCase().includes(normalized));
  }, [query, products]);

  return (
    <main className="search-page">
      <section className="container search-page__intro">
        <p className="page-kicker">Find a treat</p>
        <h1>Search the menu</h1>
        <p>Search by product, flavour, or category.</p>
        <label className="visually-hidden" htmlFor="search-q">Search products</label>
        <InputGroup className="search-field">
          <InputGroupInput id="search-q" type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Banana bread, brownies, small chops..." />
          <InputGroupAddon><SearchIcon size={19} aria-hidden="true" /></InputGroupAddon>
          {input && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-sm" onClick={() => setInput('')} aria-label="Clear search"><X size={17} aria-hidden="true" /></InputGroupButton></InputGroupAddon>}
        </InputGroup>
      </section>

      <section className="container search-page__results" aria-live="polite">
        {query.length < 2 ? <PopularCategories categories={categories} /> : productsLoading ? <div className="search-grid" aria-label="Loading search results">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton search-grid__skeleton" />)}</div> : results.length > 0 ? <><div className="search-results__header"><h2>Results for “{query}”</h2><span>{results.length} {results.length === 1 ? 'item' : 'items'}</span></div><div className="search-grid">{results.map((product) => <ProductCard key={product.slug} product={product} />)}</div></> : <EmptyState icon={SearchIcon} title={`No results for “${query}”`} desc="Try a broader product name or browse a category below."><PopularCategories categories={categories} compact /></EmptyState>}
      </section>
    </main>
  );
}

function PopularCategories({ categories, compact = false }) {
  if (!categories?.length) return null;
  return <div className={`search-categories${compact ? ' is-compact' : ''}`}><div><p className="page-kicker">Browse instead</p><h2>Popular categories</h2></div><div>{categories.map((category) => <Link key={category.id} to={`/menu/${category.id}`}>{category.name}<ArrowRight size={14} aria-hidden="true" /></Link>)}</div></div>;
}
