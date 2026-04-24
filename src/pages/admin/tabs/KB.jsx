import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../utils/helpers';
import Swal from 'sweetalert2';

export default function KB() {
    const showToast = useToast();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'General',
        is_active: true
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/kb');
            setArticles(data.articles || []);
        } catch (error) {
            console.error('Error fetching articles:', error);
            showToast('Failed to load KB articles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (article = null) => {
        if (article) {
            setEditingArticle(article);
            setFormData({
                title: article.title,
                content: article.content,
                category: article.category,
                is_active: article.is_active === 1
            });
        } else {
            setEditingArticle(null);
            setFormData({
                title: '',
                content: '',
                category: 'General',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingArticle) {
                await api.put(`/admin/kb/${editingArticle.id}`, formData);
                showToast('Article updated successfully', 'success');
            } else {
                await api.post('/admin/kb', formData);
                showToast('Article created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchArticles();
        } catch (error) {
            showToast(error.message || 'Failed to save article', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Hapus Artikel?',
            text: "Artikel ini akan dihapus secara permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.05)',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            background: '#0a0b10',
            color: '#fff',
            customClass: {
                popup: 'rounded-3xl border border-white/5 backdrop-blur-xl',
                confirmButton: 'rounded-xl font-bold px-6 py-2.5',
                cancelButton: 'rounded-xl font-bold px-6 py-2.5 text-text-muted'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.del(`/admin/kb/${id}`);
                showToast('Article deleted', 'success');
                fetchArticles();
            } catch (error) {
                showToast(error.message || 'Failed to delete article', 'error');
            }
        }
    };

    const filteredArticles = articles.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-text-primary">Knowledge Base</h2>
                    <p className="text-xs text-text-muted mt-1 uppercase font-bold tracking-wider">
                        Manage help articles and documentation
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-[0_10px_20px_-5px_rgba(99,102,241,0.4)]"
                >
                    <Plus size={18} />
                    <span>Create Article</span>
                </button>
            </div>

            {/* Stats & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        type="text"
                        placeholder="Search articles by title or category..."
                        className="input pl-12 w-full bg-white/[0.02] border-white/5 focus:border-accent-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-2">
                    <span className="text-xs font-bold text-text-muted uppercase">Total:</span>
                    <span className="text-lg font-black text-accent-primary leading-none">{articles.length}</span>
                </div>
            </div>

            {/* Articles List */}
            <div className="grid gap-4">
                {filteredArticles.length === 0 ? (
                    <div className="card p-12 text-center border-dashed border-2 border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">No articles found</h3>
                        <p className="text-sm text-text-muted mt-1">Start by creating your first help article.</p>
                    </div>
                ) : (
                    filteredArticles.map(article => (
                        <div key={article.id} className="card group hover:border-accent-primary/20 transition-all p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary flex-shrink-0">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-text-primary leading-tight">{article.title}</h3>
                                            {article.is_active ? (
                                                <span className="status-badge status-active scale-75 origin-left">Visible</span>
                                            ) : (
                                                <span className="status-badge status-suspended scale-75 origin-left">Hidden</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                            <span className="text-xs text-accent-primary font-black uppercase tracking-widest">{article.category}</span>
                                            <span className="text-xs text-text-muted">Created: {formatDate(article.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenModal(article)}
                                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-primary transition-colors"
                                        title="Edit Article"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(article.id)}
                                        className="w-10 h-10 rounded-xl bg-danger/10 hover:bg-danger/20 flex items-center justify-center text-danger transition-colors border border-danger/20"
                                        title="Delete Article"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="card w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-black text-text-primary">
                                {editingArticle ? 'Update Article' : 'Create New Article'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        placeholder="e.g., How to setup your server"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        placeholder="e.g., Setup, Billing, General"
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Content (HTML Supported)</label>
                                <textarea 
                                    className="form-input min-h-[250px] font-mono text-sm" 
                                    value={formData.content}
                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                    placeholder="Write your article content here..."
                                    required 
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <input 
                                    type="checkbox" 
                                    id="is_active"
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-accent-primary focus:ring-accent-primary"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-text-primary cursor-pointer">
                                    Make this article visible to users
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="submit" className="btn btn-primary flex-1 py-3 rounded-2xl font-black tracking-wide">
                                    {editingArticle ? 'Save Changes' : 'Publish Article'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary px-8 py-3 rounded-2xl font-black">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
