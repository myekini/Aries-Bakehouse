'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import ProductCard from '../components/ProductCard.jsx';
import { Button } from '../components/ui/button.jsx';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../components/ui/input-group.jsx';
import { Select } from '../components/ui/select.jsx';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb.jsx';

// `categories`/`products`, when passed, are server-fetched by
// src/app/menu/page.jsx (and src/app/menu/[category]/page.jsx) under ISR —
// see the `initial` param comment in useCatalog.js.
export default function Menu({ categories: initialCategories, products: initialProducts } = {}) {
  const { category: categoryFromRoute } = useParams();
  const [category, setCategory] = useState(categoryFromRoute || 'all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');

  const { data: categories, loading: categoriesLoading } = useCategories(initialCategories);
  const { data: products, loading: productsLoading } = useProducts(initialProducts);

  useEffect(() => {
    setCategory(categoryFromRoute || 'all');
  }, [categoryFromRoute]);

  const filtered = useMemo(() => {
    let list = products || [];
    if (category !== 'all') list = list.filter((product) => product.category === category);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter((product) => (
        product.name.toLowerCase().includes(query)
        || product.desc?.toLowerCase().includes(query)
      ));
    }
    if (sort === 'price-asc') list = [...list].sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
    if (sort === 'price-desc') list = [...list].sort((a, b) => (b.startingPrice ?? -Infinity) - (a.startingPrice ?? -Infinity));
    if (sort === 'newest') list = [...list].reverse();
    return list;
  }, [category, products, search, sort]);

  const activeCategory = category === 'all'
    ? 'All treats'
    : categories?.find((item) => item.id === category)?.name || formatCategoryName(category);

  function clearFilters() {
    setCategory('all');
    setSearch('');
    setSort('featured');
  }

  return (
    <div className="menu-page">
      <section className="container menu-page__intro" aria-labelledby="menu-title">
        <MenuBreadcrumb category={category} categoryName={activeCategory} />
        <p className="page-kicker">Made to order in Abeokuta</p>
        <div className="menu-page__intro-grid">
          <h1 id="menu-title">The full menu.</h1>
          <p>Choose your treat, configure the details, and give the kitchen at least 24 hours to make it fresh.</p>
        </div>
      </section>

      <section className="container menu-controls" aria-label="Menu filters">
        <div className="menu-tabs" aria-label="Filter by product category">
          {[{ id: 'all', name: 'All' }, ...(categoriesLoading ? [] : categories || [])].map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={category === item.id ? 'olive' : 'secondary'}
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
              className="menu-tabs__button"
            >
              {item.name}
            </Button>
          ))}
        </div>

        <div className="menu-controls__row">
          <div className="menu-controls__search">
            <label className="menu-controls__label" htmlFor="menu-search">Search</label>
            <InputGroup>
              <InputGroupInput
                id="menu-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search the menu"
              />
              <InputGroupAddon><SearchIcon size={16} aria-hidden="true" /></InputGroupAddon>
            </InputGroup>
          </div>
          <div className="menu-controls__sort">
            <label className="menu-controls__label" htmlFor="menu-sort">Sort by</label>
            <Select id="menu-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </Select>
          </div>
        </div>

        <div className="menu-results-meta" aria-live="polite">
          <span>{activeCategory}</span>
          {!productsLoading && <span>{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>}
        </div>
      </section>

      <section className="container menu-results" aria-label={`${activeCategory} products`}>
        {productsLoading ? (
          <div className="menu-product-grid" aria-label="Loading products">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton menu-product-grid__skeleton" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="menu-product-grid">
            {filtered.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        ) : (
          <div className="menu-empty">
            <h2>No treats match those filters.</h2>
            <p>Try another category or clear the search.</p>
            <Button type="button" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}
      </section>
    </div>
  );
}

function MenuBreadcrumb({ category, categoryName }) {
  const showingCategory = category !== 'all';
  return (
    <Breadcrumb className="menu-breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {showingCategory
            ? <BreadcrumbLink render={<Link to="/menu" />}>Menu</BreadcrumbLink>
            : <BreadcrumbPage>Menu</BreadcrumbPage>}
        </BreadcrumbItem>
        {showingCategory && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{categoryName}</BreadcrumbPage></BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function formatCategoryName(value) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
