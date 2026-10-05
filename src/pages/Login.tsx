// src/pages/Login.tsx
import { useState } from 'react';
import { Compass, Lock, Mail, LogIn, ShieldCheck, Building2, Users, MapPin } from 'lucide-react';
import { useCRM } from '@/store/crm';
import type { Role } from '@/store/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const QUICK: { role: Role; icon: React.ElementType; email: string; password: string; name: string; blurb: string }[] = [
  { role: 'Super Admin', icon: ShieldCheck, email: 'superadmin@crm360.local', password: 'Super@123', name: 'System Administrator', blurb: 'Full platform control · all companies · audit logs' },
  { role: 'Company Admin', icon: Building2, email: 'admin@acme.crm360.local', password: 'Admin@123', name: 'Company Administrator', blurb: 'ACME Corporation · employees, customers, audit' },
  { role: 'Manager', icon: Users, email: 'manager@acme.crm360.local', password: 'Manager@123', name: 'Sales Manager', blurb: 'Team pipeline · live tracking · visits · reports' },
  { role: 'Employee', icon: MapPin, email: 'employee@acme.crm360.local', password: 'Employee@123', name: 'Sales Employee', blurb: 'Own leads & tasks · check-in / visits' },
];

export default function Login() {
  const crm = useCRM();
  const { login } = crm;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => setError(await login(email, password));

  if (crm.isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (crm.user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[420px] flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-sage">
            <Compass className="size-5 text-sidebar" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight text-white">CRM 360</div>
            <div className="kicker text-sidebar-accent">Sales + Geo Tracking</div>
          </div>
        </div>
        <div>
          <h2 className="font-display text-[28px] font-semibold leading-tight text-white">One workspace for<br />sales, customers<br />& field teams.</h2>
          <ul className="mt-6 space-y-2 font-mono2 text-[11px] text-sidebar-foreground/80">
            <li>— Lead → Customer → Account conversion</li>
            <li>— GPS-verified check-in & customer visits</li>
            <li>— Role-based access for 4 personas</li>
          </ul>
        </div>
        <div className="kicker text-sidebar-border">SRS-aligned · JWT/API-ready</div>
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
            <Input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="you@company.com" className="h-10 pl-9" />
          </div>
          <label className="kicker text-muted-foreground">Password</label>
          <div className="relative mt-1.5">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••••" className="h-10 pl-9" />
          </div>
          <div className="mt-1.5 text-right"><button className="font-mono2 text-[10.5px] text-muted-foreground hover:text-foreground">Forgot password?</button></div>

          {error && <div className="mt-3 rounded-md border border-destructive-border bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</div>}

          <Button onClick={submit} className="mt-5 w-full h-10">
            <LogIn className="size-4 mr-2" /> Login
          </Button>

          <div className="kicker mt-8 mb-2 text-muted-foreground">One-click demo roles</div>
          <div className="space-y-1.5">
            {QUICK.map(q => (
              <button key={q.role} onClick={async () => setError(await login(q.email, q.password))}
                className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-sage">
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
