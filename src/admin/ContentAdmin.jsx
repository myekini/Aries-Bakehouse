import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const DEFAULT_ANNOUNCEMENT = { active: true, text: 'Orders require 24 hours notice.' };
const DEFAULT_PROMO = {
  active: true,
  eyebrow: 'This Month',
  title: 'Order a Cake Parfait bundle for your next gathering.',
  href: '/menu/cake-treats',
  cta: 'Browse Cake Treats',
};

export default function ContentAdmin() {
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);
  const [promo, setPromo] = useState(DEFAULT_PROMO);
  const [bestsellers, setBestsellers] = useState('');
  const [featured, setFeatured] = useState('');
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('site_content').select('*').in('key', ['announcement_bar', 'promo_banner', 'homepage_bestsellers', 'homepage_featured']).then(({ data }) => {
      const row = (key) => data?.find((r) => r.key === key)?.value;
      setAnnouncement({ ...DEFAULT_ANNOUNCEMENT, ...(row('announcement_bar') || {}) });
      setPromo({ ...DEFAULT_PROMO, ...(row('promo_banner') || {}) });
      setBestsellers(JSON.stringify(row('homepage_bestsellers') || [], null, 2));
      setFeatured(JSON.stringify(row('homepage_featured') || [], null, 2));
      setLoading(false);
    });
  }, []);

  async function saveValue(key, value) {
    setSaving(key);
    const { error } = await supabase.from('site_content').upsert({ key, value, updated_at: new Date().toISOString() });
    setSaving('');
    if (error) alert(error.message);
  }

  async function saveJson(key, rawValue) {
    try {
      await saveValue(key, JSON.parse(rawValue));
    } catch (err) {
      alert(`Invalid JSON: ${err.message}`);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Site Content</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Update launch content without code changes: announcement bar, homepage promo, featured picks, and bestseller picks.
      </p>

      <section className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={sectionTitle}>Announcement Bar</div>
        <label style={checkLabel}>
          <input type="checkbox" checked={announcement.active} onChange={(e) => setAnnouncement((v) => ({ ...v, active: e.target.checked }))} /> Active
        </label>
        <input value={announcement.text} onChange={(e) => setAnnouncement((v) => ({ ...v, text: e.target.value }))} placeholder="Announcement text" style={{ width: '100%', marginTop: 10 }} />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={saving === 'announcement_bar'} aria-busy={saving === 'announcement_bar'} onClick={() => saveValue('announcement_bar', announcement)}>
          Save Announcement
        </button>
      </section>

      <section className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={sectionTitle}>Homepage Promo Banner</div>
        <label style={checkLabel}>
          <input type="checkbox" checked={promo.active} onChange={(e) => setPromo((v) => ({ ...v, active: e.target.checked }))} /> Active
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
          <input value={promo.eyebrow} onChange={(e) => setPromo((v) => ({ ...v, eyebrow: e.target.value }))} placeholder="Eyebrow" />
          <input value={promo.href} onChange={(e) => setPromo((v) => ({ ...v, href: e.target.value }))} placeholder="/menu/cake-treats" />
          <input value={promo.cta} onChange={(e) => setPromo((v) => ({ ...v, cta: e.target.value }))} placeholder="CTA label" />
        </div>
        <textarea value={promo.title} onChange={(e) => setPromo((v) => ({ ...v, title: e.target.value }))} placeholder="Promo headline" style={{ width: '100%', height: 70, marginTop: 10 }} />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={saving === 'promo_banner'} aria-busy={saving === 'promo_banner'} onClick={() => saveValue('promo_banner', promo)}>
          Save Promo
        </button>
      </section>

      <section className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={sectionTitle}>Homepage Bestsellers</div>
        <p style={helperText}>JSON array of product slugs, used before real order data is ready.</p>
        <textarea value={bestsellers} onChange={(e) => setBestsellers(e.target.value)} style={jsonArea} />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={saving === 'homepage_bestsellers'} aria-busy={saving === 'homepage_bestsellers'} onClick={() => saveJson('homepage_bestsellers', bestsellers)}>Save Bestsellers</button>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <div style={sectionTitle}>Homepage Featured</div>
        <p style={helperText}>JSON array of objects like {'{ "slug": "brownie-box", "tag": "Box of 4 Brownies" }'}.</p>
        <textarea value={featured} onChange={(e) => setFeatured(e.target.value)} style={{ ...jsonArea, height: 160 }} />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={saving === 'homepage_featured'} aria-busy={saving === 'homepage_featured'} onClick={() => saveJson('homepage_featured', featured)}>Save Featured</button>
      </section>
    </div>
  );
}

const sectionTitle = {
  fontSize: 13,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-olive)',
  marginBottom: 12,
};

const checkLabel = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 };
const helperText = { fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 10px' };
const jsonArea = { width: '100%', height: 120, fontFamily: 'monospace', fontSize: 12 };
