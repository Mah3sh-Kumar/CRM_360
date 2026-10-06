// src/pages/Login.tsx
import { useState } from 'react';
import { Compass, Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useCRM } from '@/store/crm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const crm = useCRM();
  const { login } = crm;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setLoading(true);
    const err = await login(email, password);
    setError(err);
    setLoading(false);
  };

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
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/30">
      {/* Left Panel - Premium Brand Side */}
      <div className="relative hidden w-[45%] overflow-hidden bg-zinc-950 lg:flex flex-col justify-center p-12 text-white border-r border-border/10">
        {/* Dynamic Background Elements */}
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
        
        <div className="relative z-10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700 mb-12">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Compass className="size-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-2xl font-bold tracking-tight">CRM 360</div>
            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-0.5">Enterprise Edition</div>
          </div>
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
          <h2 className="font-display text-[3.25rem] font-bold leading-[1.1] tracking-tight">
            Elevate your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              sales intelligence.
            </span>
          </h2>
          <p className="mt-6 max-w-[90%] text-[17px] text-zinc-400 leading-relaxed font-light">
            One unified workspace to manage leads, track field visits, and accelerate your entire revenue pipeline.
          </p>
          
          <div className="mt-10 grid gap-4">
            {['Lead to Account Conversion', 'GPS-Verified Customer Visits', 'Advanced Role-Based Access'].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-[15px] font-medium text-zinc-300">
                <div className="flex size-7 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                  <ShieldCheck className="size-4" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-display text-[28px] font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">Sign in to your account to continue.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 group">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="you@company.com" 
                  className="h-11 pl-10 bg-background transition-all focus-visible:ring-primary/20 focus-visible:border-primary text-[14px]" 
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">Password</label>
                <button className="text-[12px] font-semibold text-primary hover:underline underline-offset-4 transition-all">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="••••••••" 
                  className="h-11 pl-10 pr-10 bg-background transition-all focus-visible:ring-primary/20 focus-visible:border-primary text-[14px]" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-in slide-in-from-top-2 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-[13px] text-destructive font-medium">
                <ShieldCheck className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button 
              onClick={submit} 
              disabled={loading}
              className="mt-3 w-full h-11 text-[14px] font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : (
                <>Sign In <ArrowRight className="ml-2 size-4.5" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
