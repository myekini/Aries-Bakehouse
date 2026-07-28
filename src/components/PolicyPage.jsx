export default function PolicyPage({ title, sections }) {
  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 32 }}>{title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {sections.map((s) => (
          <div key={s.heading}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.heading}</h2>
            <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
