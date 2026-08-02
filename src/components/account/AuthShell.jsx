import { Card } from '../ui/card.jsx';

export default function AuthShell({
  eyebrow = 'Customer account',
  title,
  description,
  children,
  footer,
}) {
  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-shell">
        <Card className="auth-panel">
          <header className="auth-panel__header">
            <p className="auth-panel__eyebrow">{eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            {description && <p className="auth-panel__description">{description}</p>}
          </header>
          {children}
        </Card>
        {footer && <div className="auth-shell__footer">{footer}</div>}
      </div>
    </section>
  );
}
