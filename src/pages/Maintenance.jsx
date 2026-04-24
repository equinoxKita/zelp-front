import { WrenchIcon } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-8">
      <div className="text-center animate-in max-w-md">
        <div className="w-24 h-24 rounded-3xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-8 text-warning">
          <WrenchIcon size={48} />
        </div>
        <h1 className="text-4xl font-black text-text-primary mb-4">Under Maintenance</h1>
        <p className="text-text-secondary text-lg leading-relaxed mb-8">
          Kami sedang melakukan pemeliharaan sistem. Silakan coba lagi beberapa saat.
        </p>
        <button onClick={() => window.location.reload()} className="btn btn-primary px-8 py-3 rounded-2xl font-black">
          🔄 Coba Lagi
        </button>
      </div>
    </div>
  );
}
