export default function PolicyPage({ title, sections }) {
  return (
    <div className="container content-page">
      <header className="content-page__header">
        <p className="page-kicker">Aries 11 Bakehouse</p>
        <h1>{title}</h1>
      </header>
      <div className="content-page__sections">
        {sections.map((s) => (
          <article key={s.heading}>
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
