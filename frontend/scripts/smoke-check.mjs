import { readFileSync } from 'node:fs';

const files = {
  app: readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  layout: readFileSync(new URL('../src/components/layout/AppLayout.tsx', import.meta.url), 'utf8'),
  types: readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8'),
  api: readFileSync(new URL('../src/api/client.ts', import.meta.url), 'utf8'),
};

const requiredRoutes = [
  'email-alerts',
  'settings',
  'threats/:id',
  'incidents/:id',
  'ip-reputation',
  'cve-lookup',
];

for (const route of requiredRoutes) {
  if (!files.app.includes(route) && !files.layout.includes(route)) {
    throw new Error(`Missing route or navigation entry: ${route}`);
  }
}

const requiredTypes = ['refreshToken', 'failedLoginTimeline', 'topCountries', 'topIsps'];
for (const typeName of requiredTypes) {
  if (!files.types.includes(typeName)) {
    throw new Error(`Missing frontend type field: ${typeName}`);
  }
}

if (!files.api.includes('/auth/refresh')) {
  throw new Error('Missing refresh-token retry handling in API client.');
}

console.log('Frontend smoke checks passed.');
