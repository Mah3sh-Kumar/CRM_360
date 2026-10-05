const fs = require('fs');
const file = 'm:/CRM_KIMI/src/store/crm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add parseApiError function
if (!content.includes('parseApiError')) {
  const insertIndex = content.indexOf('const nowTime = () =>');
  content = content.slice(0, insertIndex) + 'function parseApiError(err: any, fallback: string): string {\n  if (err?.detail) {\n    if (typeof err.detail === "string") return err.detail;\n    if (Array.isArray(err.detail)) return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");\n    return JSON.stringify(err.detail);\n  }\n  return fallback;\n}\n\n' + content.slice(insertIndex);
}

// Replace err.detail || '...' with parseApiError(err, '...')
content = content.replace(/err\.detail\s*\|\|\s*(["'])(.*?)(["'])/g, 'parseApiError(err, $1$2$3)');

fs.writeFileSync(file, content);
console.log('Done!');
