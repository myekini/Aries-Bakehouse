import { useCart } from '../context/CartContext.jsx';

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  const type = typeof toast === 'string' ? 'success' : toast.type;
  const msg = typeof toast === 'string' ? toast : toast.msg;
  const background = type === 'error' ? 'var(--color-error)' : type === 'info' ? 'var(--color-cocoa)' : 'var(--color-olive)';
  return (
    <div
      role="status" aria-live="polite"
      style={{
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        background, color: 'var(--color-white)', padding: '14px 26px',
        borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 200,
        boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
      }}
    >
      {msg}
    </div>
  );
}
