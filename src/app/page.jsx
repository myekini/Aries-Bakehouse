import Home from '../screens/Home.jsx';
import { getCategories, getHomepageFeatured } from '../lib/catalog.js';

// ISR: re-fetched from Supabase at most once every 5 minutes per the Next.js
// data cache, instead of every visitor's browser hitting Supabase directly
// on every page load (previously all client-side via useEffect).
export const revalidate = 300;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getHomepageFeatured(),
  ]);
  return <Home categories={categories} featured={featured} />;
}
