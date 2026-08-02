import Menu from '../../screens/Menu.jsx';
import { getCategories, getProducts } from '../../lib/catalog.js';

export const revalidate = 300;

export default async function MenuPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return <Menu categories={categories} products={products} />;
}
