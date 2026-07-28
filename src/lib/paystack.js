// Loads Paystack's inline script once, on demand (only when Checkout
// actually needs it), rather than on every page via index.html.
let loadPromise = null;

export function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => { loadPromise = null; reject(new Error('Failed to load Paystack script')); };
    document.head.appendChild(script);
  });
  return loadPromise;
}
