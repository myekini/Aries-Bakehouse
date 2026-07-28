import EmptyState from '../components/EmptyState.jsx';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '96px 0' }}>
      <EmptyState title="Page not found" desc="The page you're looking for doesn't exist." actionLabel="Back to Home" actionTo="/" />
    </div>
  );
}
