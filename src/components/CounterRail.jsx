import { Link } from 'react-router-dom';
import { Button } from './ui/button.jsx';

export default function CounterRail({ categories }) {
  if (!categories?.length) return null;

  return (
    <section className="container category-showcase" aria-labelledby="category-showcase-title">
      <div className="home-section__header">
        <div>
          <p className="home-section__kicker">The bakehouse menu</p>
          <h2 id="category-showcase-title">Choose your craving</h2>
          <p>Start with a category, then configure the details.</p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/menu">View full menu</Link>
        </Button>
      </div>

      <div className="category-showcase__grid" role="list">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/menu/${category.id}`}
            className="category-showcase__item"
            role="listitem"
          >
            <span className="category-showcase__copy">
              <strong>{category.name}</strong>
              {category.desc && <span>{category.desc}</span>}
            </span>
            <span className="category-showcase__arrow" aria-hidden="true">&rarr;</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
