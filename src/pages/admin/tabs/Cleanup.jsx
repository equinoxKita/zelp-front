import { Trash2 } from 'lucide-react';

export default function Cleanup() {
  return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-danger/10 text-danger border border-danger/20">
        <Trash2 size={32} />
      </div>
      <h2 className="text-xl font-black text-text-primary mb-2">Cleanup Tools</h2>
      <p className="text-text-muted text-sm max-w-sm mx-auto">
        This utility allows you to purge inactive accounts and temporary storage.
        Implementation of the cleanup logic is currently in progress.
      </p>
    </div>
  );
}
