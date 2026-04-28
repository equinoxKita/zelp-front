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
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    api.get('/kb').then((d) => setArticles(d.articles || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (articleId) {
      setLoading(true);
      api.get(`/kb/${articleId}`)
        .then((res) => {
          setSelected(res.article);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setSelected(null);
    }
  }, [articleId]);

  const parseEmbeds = (content) => {
    if (!content) return '';
    
    // Regexes
    const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?)/gi;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
    const videoRegex = /(https?:\/\/.*\.(?:mp4|webm|ogg)(?:\?.*)?)/gi;
    
    let parsed = content;
    
    // 1. YouTube Embeds
    parsed = parsed.replace(youtubeRegex, (match, videoId) => {
      if (content.includes(`src="https://www.youtube.com/embed/${videoId}"`)) return match;
      return `<div class="my-6 aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>`;
    });

    // 2. Direct Video Embeds
    parsed = parsed.replace(videoRegex, (match) => {
      if (content.includes(`src="${match}"`)) return match;
      return `<div class="my-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
        <video src="${match}" controls class="w-full h-auto"></video>
      </div>`;
    });

    // 3. Image Embeds
    parsed = parsed.replace(imgRegex, (match) => {
      if (content.includes(`src="${match}"`) || content.includes(`href="${match}"`)) return match;
      return `<div class="my-6"><img src="${match}" alt="Embedded Image" class="rounded-2xl border border-white/10 max-w-full h-auto shadow-2xl" /></div>`;
    });

    return parsed;
  };

  const categories = ['All', ...new Set(articles.map((a) => a.category))];

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title?.toLowerCase().includes(search.toLowerCase()) ||
                         a.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-accent-primary/10 text-accent-primary text-[10px] font-black uppercase tracking-wider border border-accent-primary/20">
                {selected.category}
              </span>
              <span className="text-text-muted text-xs font-medium">•</span>
              <span className="text-text-muted text-xs font-medium">{formatDate(selected.created_at)}</span>
            </div>
            <h2 className="text-2xl font-black text-text-primary mb-2">{selected.title}</h2>
          </div>
          <div
            className="prose prose-invert max-w-none text-text-secondary text-sm leading-relaxed [&_h1]:text-text-primary [&_h2]:text-text-primary [&_h3]:text-text-primary [&_a]:text-accent-primary"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(parseEmbeds(selected.content), {
                ADD_TAGS: ['iframe', 'video', 'source'],
                ADD_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'controls', 'autoplay', 'muted', 'loop', 'type']
              }) 
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            {/* Search */}
            <div className="relative w-full max-w-md">
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

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-accent-primary text-white shadow-glow-sm'
                      : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded border border-accent-primary/10">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-text-muted">{formatDate(art.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-text-primary">{art.title}</h3>
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
