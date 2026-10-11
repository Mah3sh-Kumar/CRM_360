const fs = require('fs');

let content = fs.readFileSync('src/store/crm.tsx', 'utf8');

if (!content.includes('import { apiFetch }')) {
    content = content.replace("import { can } from '@/auth/rbac';", "import { can } from '@/auth/rbac';\nimport { apiFetch } from '@/lib/api';");
}

// Global parseApiError
content = content.replace(/function parseApiError[\s\S]*?return fallback;\n}/, `function parseApiError(err: any, fallback: string): string {
  if (err?.detail) {
    if (typeof err.detail === "string") return err.detail;
    if (Array.isArray(err.detail)) return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
    return JSON.stringify(err.detail);
  }
  return err?.message || fallback;
}`);

// Auth block
content = content.replace(/fetch\("http:\/\/localhost:8000\/api\/auth\/me", { headers: { Authorization: `Bearer \${token}` } }\)[\s\S]*?\.then\(me => {/, `apiFetch("/auth/me")
        .then(me => {`);
content = content.replace(/const res = await fetch\("http:\/\/localhost:8000\/api\/auth\/login", {[\s\S]*?body: JSON.stringify\({ email, password }\),[\s\S]*?}\);[\s\S]*?if \(!res\.ok\) return "Incorrect email or password.";[\s\S]*?const data = await res\.json\(\);[\s\S]*?localStorage\.setItem\("crm_token", data\.access_token\);[\s\S]*?const meRes = await fetch\("http:\/\/localhost:8000\/api\/auth\/me", { headers: { Authorization: `Bearer \${data\.access_token}` } }\);[\s\S]*?if \(meRes\.ok\) {[\s\S]*?const me = await meRes\.json\(\);/, `const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("crm_token", data.access_token);
      
      try {
        const me = await apiFetch("/auth/me");`);
content = content.replace(/return "Failed to load user profile.";/, `} catch (e) {
        return "Failed to load user profile.";
      }`);


// GET block
const getRegex = /const token = localStorage\.getItem\("crm_token"\);\s*if \(!token\) throw new Error\("No token"\);\s*const res = await fetch\(`?(?:http:\/\/localhost:8000)?\/api\/([^`"]+)`?, {\s*headers: { Authorization: `Bearer \${token}` }\s*}\);\s*if \(res\.ok\) {\s*const data = await res\.json\(\);/g;
content = content.replace(getRegex, 'const data = await apiFetch(`/$1`);\n      if (true) {');

// Remove the `} else { throw new Error("Failed to fetch"); }` for GETs
content = content.replace(/} else {\s*throw new Error\("Failed to fetch"\);\s*}/g, '');


// POST/PUT/DELETE block
// These blocks look like:
// const token = localStorage.getItem("crm_token");
// const res = await fetch("http://localhost:8000/api/...", { method: "POST", headers: { ... }, body: ... });
// if (res.ok) { await fetch...(); return { ok: true }; }
// const err = await res.json();
// return { ok: false, message: ... };
// } catch (e) { return { ok: false, message: "Network error" }; }

const modifyRegex = /const token = localStorage\.getItem\("crm_token"\);\s*(?:const payload: any = {};[\s\S]*?body: JSON\.stringify\(payload\)[\s\S]*?|const res = await fetch)[\s\S]*?return \{ ok: false, message: parseApiError\(err, "([^"]+)"\) \};\s*\} catch \(e\) \{\s*return \{ ok: false, message: "Network error" \};\s*\}/g;

// Instead of regex for the whole block, let's just replace `fetch` -> `apiFetch` and fix the `res` handling inside each method.
// Actually, it's easier to find the method bodies because they have a consistent signature.
const methods = ['createCompany', 'updateCompany', 'createEmployee', 'updateEmployee', 'createCustomer', 'updateCustomer', 'createLead', 'updateLead', 'createAccount', 'updateAccount', 'createContact', 'updateContact', 'createOpportunity', 'updateOpportunity', 'createActivity', 'updateActivity', 'createTask', 'updateTask', 'completeTask', 'cancelTask', 'assignTask', 'deleteTask', 'createMeeting', 'updateMeeting', 'completeMeeting', 'cancelMeeting'];

for (const method of methods) {
    const regex = new RegExp(`const ${method} = useCallback\\(async \\(.*?\\) => {([\\s\\S]*?)\\}, \\[.*?\\(?(?:fetch[A-Za-z]+)?\\)?\\]\\);`);
    const match = content.match(regex);
    if (match) {
        let body = match[1];
        
        // Remove token extraction and fetch setup
        body = body.replace(/const token = localStorage\.getItem\("crm_token"\);\s*/g, '');
        body = body.replace(/headers: \{\s*"Content-Type": "application\/json",\s*Authorization: `Bearer \$\{token\}`\s*\}/g, 'headers: { "Content-Type": "application/json" }');
        body = body.replace(/headers: \{\s*Authorization: `Bearer \$\{token\}`\s*\}/g, '');
        
        // Replace fetch with apiFetch
        body = body.replace(/const res = await fetch\(`?(?:http:\/\/localhost:8000)?\/api\//g, 'await apiFetch(`/');
        body = body.replace(/const res = await fetch\('http:\/\/localhost:8000\/api\//g, 'await apiFetch(`/');
        
        // Remove res.ok and err = res.json()
        body = body.replace(/if \(res\.ok\) {/g, '');
        body = body.replace(/const err = await res\.json\(\);/g, '');
        
        // Replace return statements inside success block (which no longer has { })
        // Wait, the success block was:
        // await fetchSomething();
        // return { ok: true };
        // }
        body = body.replace(/return \{ ok: true \};\s*}/g, 'return { ok: true };');
        
        // Replace error handling
        body = body.replace(/if \(err\.detail === "Cannot change own role"/g, 'if (e.detail === "Cannot change own role"');
        body = body.replace(/return \{ ok: false, message: parseApiError\(err, "([^"]+)"\) \};/g, 'return { ok: false, message: parseApiError(e, "$1") };');
        body = body.replace(/\} catch \(e\) {/g, '} catch (e: any) {');
        body = body.replace(/return \{ ok: false, message: "Network error" \};/g, 'return { ok: false, message: e.detail || "Network error" };');

        content = content.replace(match[1], body);
    }
}

fs.writeFileSync('src/store/crm.tsx', content);
console.log("Refactored crm.tsx");
