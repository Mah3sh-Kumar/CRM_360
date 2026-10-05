import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <h1 className="font-display text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        <ArrowLeft className="size-4" /> Go to Dashboard
      </button>
    </div>
  );
}
