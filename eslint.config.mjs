import nextConfig from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'supabase/functions/**', 'public/**'],
  },
  ...nextConfig,
];
