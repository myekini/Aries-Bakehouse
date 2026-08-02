import EmptyState from '../components/EmptyState.jsx';

export default function NotFound() {
  return (
    <main className="container not-found-page">
      <EmptyState title="Page not found" desc="The page may have moved or the link may be incorrect." actionLabel="Return home" actionTo="/" />
    </main>
  );
}
