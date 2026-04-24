import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Search, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../utils/helpers';
import DOMPurify from 'dompurify';

export default function Kb() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/kb').then((d) => setArticles(d.articles || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (articleId && articles.length > 0) {
      const art = articles.find((a) => String(a.id) === String(articleId));
      if (art) setSelected(art);
    }
  }, [articleId, articles]);

  const filtered = articles.filter((a) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-text-muted animate-pulse">Memuat...</div>;

  return (
    <div className="p-6 lg:p-8 animate-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-primary">Knowledge Base</h1>
          <p className="text-text-muted text-sm">Temukan jawaban atas pertanyaan umum Anda</p>
        </div>
      </div>

      {selected ? (
        <div className="card p-8 max-w-3xl mx-auto space-y-6">
          <button onClick={() => { setSelected(null); navigate('/kb'); }} className="btn btn-secondary btn-sm">
            ← Kembali
          </button>
          <div>
            <h2 className="text-2xl font-black text-text-primary mb-2">{selected.title}</h2>
            <p className="text-text-muted text-xs">{formatDate(selected.created_at)}</p>
          </div>
          <div
            className="prose prose-invert max-w-none text-text-secondary text-sm leading-relaxed [&_h1]:text-text-primary [&_h2]:text-text-primary [&_h3]:text-text-primary [&_a]:text-accent-primary"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.content) }}
          />
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              className="form-input pl-10 pr-10"
              placeholder="Cari artikel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Articles */}
          <div className="space-y-3">
            {filtered.map((art) => (
              <button
                key={art.id}
                onClick={() => { setSelected(art); navigate(`/kb/${art.id}`); }}
                className="w-full card p-5 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 text-left flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-text-primary mb-1">{art.title}</h3>
                  <p className="text-text-muted text-xs">{formatDate(art.created_at)}</p>
                </div>
                <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-text-muted">Tidak ada artikel yang ditemukan.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
