// src/pages/Login.tsx
import { useState } from 'react';
import { Compass, Lock, Mail, LogIn, ShieldCheck, Building2, Users, MapPin } from 'lucide-react';
import { useCRM } from '@/store/crm';
import type { Role } from '@/store/crm';

const QUICK: { role: Role; icon: React.ElementType; email: string; password: string; name: string; blurb: string }[] = [
  { role: 'Super Admin', icon: ShieldCheck, email: 'admin@crm360.io', password: 'admin123', name: 'Aditya Verma', blurb: 'Full platform control · all companies · audit logs' },
  { role: 'Company Admin', icon: Building2, email: 'arjun.mehta@apex.io', password: 'demo123', name: 'Arjun Mehta', blurb: 'Apex Industries · employees, customers, audit' },
  { role: 'Manager', icon: Users, email: 'priya.nair@apex.io', password: 'demo123', name: 'Priya Nair', blurb: 'Team pipeline · live tracking · visits · reports' },
  { role: 'Employee', icon: MapPin, email: 'rohan.k@apex.io', password: 'demo123', name: 'Rohan Kulkarni', blurb: 'Own leads & tasks · check-in / visits' },
];

export default function Login() {
  const { login } = useCRM();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => setError(login(email, password));

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[420px] flex-col justify-between bg-[#0c231e] p-10 text-[#cfe3d6] lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-[#85c093]">
            <Compass className="size-5 text-[#0c231e]" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-white">CRM 360</div>
            <div className="kicker text-[#6f9480]">Sales + Geo Tracking</div>
          </div>
        </div>
        <div>
          <h2 className="font-display text-[28px] font-semibold leading-tight text-white">One workspace for<br />sales, customers<br />& field teams.</h2>
          <ul className="mt-6 space-y-2 font-mono2 text-[11px] text-[#8fb29e]">
            <li>— Lead → Customer → Account conversion</li>
            <li>— GPS-verified check-in & customer visits</li>
            <li>— Role-based access for 4 personas</li>
          </ul>
        </div>
        <div className="kicker text-[#5d8171]">SRS-aligned · JWT/API-ready</div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <div className="kicker mb-2 text-muted-foreground">Welcome back</div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight">Sign in to CRM 360</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">Demo build — FastAPI + JWT can be wired into <span className="font-mono2 text-[11px]">store.login()</span> without UI changes.</p>
          </div>

          <label className="kicker text-muted-foreground">Email</label>
          <div className="relative mt-1.5 mb-4">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="you@company.com" className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-[13.5px] outline-none focus:ring-2 focus:ring-ring/25" />
          </div>
          <label className="kicker text-muted-foreground">Password</label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••••" className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-[13.5px] outline-none focus:ring-2 focus:ring-ring/25" />
          </div>
          <div className="mt-1.5 text-right"><button className="font-mono2 text-[10.5px] text-muted-foreground hover:text-foreground">Forgot password?</button></div>

          {error && <div className="mt-3 rounded-md border border-[#f0cdc4] bg-[#fbe9e6] px-3 py-2 text-[12px] text-[#b03a26]">{error}</div>}

          <button onClick={submit} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#007f24] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#0a6b20]">
            <LogIn className="size-4" /> Login
          </button>

          <div className="kicker mt-8 mb-2 text-muted-foreground">One-click demo roles</div>
          <div className="space-y-1.5">
            {QUICK.map(q => (
              <button key={q.role} onClick={() => setError(login(q.email, q.password))}
                className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-[#85c093]">
                <q.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-semibold">{q.role} <span className="font-normal text-muted-foreground">· {q.name}</span></span>
                  <span className="block truncate font-mono2 text-[10px] text-muted-foreground">{q.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
