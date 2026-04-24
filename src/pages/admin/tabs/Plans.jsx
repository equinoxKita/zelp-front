import { useEffect, useState, useCallback } from 'react';
import { Server, PlusCircle, Edit3, Trash2, Layers } from 'lucide-react';
import api from '../../../services/api';
import { formatNumber } from '../../../utils/helpers';
import { useToast } from '../../../context/ToastContext';

// FIX: Moved formatMB out of component — pure utility, no need to redefine on every render
function formatMB(mb) {
    if (!mb) return '0 MB';
    if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`;
    return `${mb} MB`;
}

// FIX: Moved Spec out of Plans to avoid re-definition on every render
function Spec({ children, color }) {
    return (
        <span
            className="px-2 py-0.5 rounded-md text-xs font-black"
            style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
        >
            {children}
        </span>
    );
}

// FIX: Moved FormField out of PlanModal — defining components inside components
// causes React to treat them as new components each render (unmount/remount)
function FormField({ label, id, type = 'text', form, onChange, className, ...props }) {
    return (
        <div className={`form-group mb-0 ${className}`}>
            <label className="form-label text-xs uppercase tracking-wider">{label}</label>
            <input
                id={id}
                type={type}
                className="form-input bg-white/5"
                value={form[id]}
                onChange={e => onChange(id, e.target.value)}
                {...props}
            />
        </div>
    );
}

export default function Plans() {
    const showToast = useToast();
    const [plans, setPlans] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    // FIX: Wrap load in useCallback to stabilise reference across renders
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pd, ld] = await Promise.all([
                api.get('/plans'),
                api.get('/pterodactyl/locations').catch(() => ({ locations: [] }))
            ]);
            setPlans(pd.plans || []);
            setLocations(ld.locations || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    // FIX: useEffect must not receive async function directly.
    // useEffect(load, []) === useEffect(async () => ...) which returns a Promise — not allowed.
    // Correct pattern: call the async function inside a sync callback.
    useEffect(() => {
        load();
    }, [load]);

    const deletePlan = async (id, name) => {
        if (!confirm(`Hapus plan "${name}"?`)) return;
        try {
            const data = await api.del(`/admin/plans/${id}`);
            // FIX: Optional chaining — data.message may be undefined if API returns unexpected shape
            showToast(data?.message || 'Plan berjaya dipadam.', 'success');
            load();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const updateLocation = async (planId, locId, locName) => {
        try {
            await api.put(`/admin/plans/${planId}`, {
                location_id: locId ? parseInt(locId) : null,
                location: locName
            });
            showToast('Lokasi diperbarui!', 'success');
            setPlans(prev =>
                prev.map(p =>
                    p.id === planId
                        ? { ...p, location_id: locId ? parseInt(locId) : null, location: locName }
                        : p
                )
            );
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const updateCategory = async (planId, cat) => {
        try {
            await api.put(`/admin/plans/${planId}`, { category: cat });
            showToast('Kategori diperbarui!', 'success');
            setPlans(prev =>
                prev.map(p => p.id === planId ? { ...p, category: cat } : p)
            );
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const grouped = plans.reduce((acc, p) => {
        const cat = p.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {});
    const categories = Object.keys(grouped).sort();
    const allCategories = [...new Set(plans.map(p => p.category || 'Uncategorized'))].sort();

    if (loading) return (
        <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-bg-card rounded-3xl h-32" />)}
        </div>
    );

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button
                        onClick={() => setModal({ type: 'create' })}
                        className="btn btn-primary px-5 py-2.5 font-black rounded-xl flex items-center gap-2"
                    >
                        <PlusCircle size={16} /> PROVISION NEW PLAN
                    </button>
                </div>

                {categories.map(cat => (
                    <div key={cat} className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 bg-accent-primary/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 text-accent-primary flex items-center justify-center">
                                <Layers size={15} />
                            </div>
                            <span className="font-black text-text-primary uppercase tracking-wider">
                                {cat}{' '}
                                <span className="text-text-muted font-normal opacity-50">({grouped[cat].length})</span>
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="data-table w-full">
                                <thead>
                                    <tr className="bg-white/[0.02]">
                                        {['#', 'Name', 'Specs', 'Price', 'Location', 'Category', 'Controls'].map((h, i) => (
                                            <th
                                                key={h}
                                                // FIX: Use explicit classes instead of dynamic px-${} — Tailwind purges dynamic classes in production
                                                className={`${i === 0 || i === 6 ? 'px-6' : 'px-4'} py-3.5 border-b-2 border-white/5 text-xs text-text-muted font-black uppercase ${i === 6 ? 'text-right' : ''}`}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {grouped[cat].map(p => (
                                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 border-b border-white/5 font-black text-text-primary font-mono">
                                                #{p.id}
                                            </td>
                                            <td className="px-4 py-4 border-b border-white/5 font-black text-text-primary">
                                                {p.name}
                                            </td>
                                            <td className="px-4 py-4 border-b border-white/5">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <Spec color="#0ea5e9">CPU {p.cpu}%</Spec>
                                                    <Spec color="#8b5cf6">RAM {formatMB(p.ram_mb)}</Spec>
                                                    <Spec color="#6b7280">DISK {formatMB(p.disk_mb)}</Spec>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 border-b border-white/5 font-black text-text-primary">
                                                Rp {formatNumber(p.price_monthly)}
                                                <span className="text-xs text-text-muted font-normal">/bln</span>
                                            </td>
                                            <td className="px-4 py-4 border-b border-white/5">
                                                {/* FIX: value instead of defaultValue — controlled component updates correctly when plans state changes */}
                                                <select
                                                    className="form-input h-9 py-0 text-xs font-bold w-36 bg-white/5"
                                                    value={p.location_id || ''}
                                                    onChange={e => {
                                                        const opt = e.target.options[e.target.selectedIndex];
                                                        updateLocation(p.id, e.target.value, opt.dataset.short || '');
                                                    }}
                                                >
                                                    <option value="">-- None --</option>
                                                    {locations.map(l => (
                                                        <option key={l.id} value={l.id} data-short={l.short}>{l.short}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4 border-b border-white/5">
                                                {/* FIX: value instead of defaultValue */}
                                                <select
                                                    className="form-input h-9 py-0 text-xs font-bold w-36 bg-white/5"
                                                    value={p.category || 'Uncategorized'}
                                                    onChange={e => updateCategory(p.id, e.target.value)}
                                                >
                                                    {allCategories.map(c => (
                                                        <option key={c} value={c}>{c.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 border-b border-white/5 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => setModal({ type: 'edit', plan: p })}
                                                        className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center justify-center hover:scale-110 transition-all"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => deletePlan(p.id, p.name)}
                                                        className="w-9 h-9 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center hover:scale-110 transition-all"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {modal && (
                <PlanModal
                    type={modal.type}
                    plan={modal.plan}
                    categories={allCategories}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); load(); }}
                    showToast={showToast}
                />
            )}
        </>
    );
}

function PlanModal({ type, plan, categories, onClose, onSaved, showToast }) {
    const isEdit = type === 'edit';
    const [form, setForm] = useState({
        name: plan?.name || '',
        description: plan?.description || '',
        category: plan?.category || 'Uncategorized',
        price_monthly: plan?.price_monthly || '',
        cpu: plan?.cpu || '',
        ram_mb: plan?.ram_mb || '',
        disk_mb: plan?.disk_mb || '',
        swap_mb: plan?.swap_mb || 0,
        io: plan?.io || 500,
        backups: plan?.backups || 3,
        databases_count: plan?.databases_count || 2,
        allocations: plan?.allocations || 1,
        location_id: plan?.location_id || '',
        node_id: plan?.node_id || '',
        nest_id: plan?.nest_id || '',
        egg_id: plan?.egg_id || '',
        setup_type: plan?.setup_type || 'auto',
    });
    const [locations, setLocations] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [nests, setNests] = useState([]);
    const [eggs, setEggs] = useState([]);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    useEffect(() => {
        // FIX: Added .catch() on Promise.all — individual catches only cover each sub-request,
        // not failures in the Promise.all orchestration itself
        Promise.all([
            api.get('/pterodactyl/locations').catch(() => ({ locations: [] })),
            api.get('/pterodactyl/nests').catch(() => ({ nests: [] })),
            api.get('/pterodactyl/nodes').catch(() => ({ nodes: [] })),
        ])
            .then(([ld, nd, nod]) => {
                setLocations(ld.locations || []);
                setNests(nd.nests || []);
                setNodes(nod.nodes || []);
            })
            .catch(() => {
                showToast('Gagal memuatkan data konfigurasi Pterodactyl.', 'error');
            });
    }, []);

    useEffect(() => {
        if (form.nest_id) {
            api.get(`/pterodactyl/nests/${form.nest_id}/eggs`)
                .then(d => setEggs(d.eggs || []))
                .catch(() => setEggs([]));
        } else {
            setEggs([]);
        }
    }, [form.nest_id]);

    const filteredNodes = form.location_id
        ? nodes.filter(n => n.location_id === parseInt(form.location_id))
        : nodes;

    const submit = async (e) => {
        e.preventDefault();

        // FIX: Validate required fields before API call to prevent NaN values being sent
        if (!form.name?.trim()) {
            return showToast('Nama plan wajib diisi.', 'error');
        }
        if (!form.price_monthly || isNaN(parseInt(form.price_monthly))) {
            return showToast('Harga per bulan wajib diisi.', 'error');
        }
        if (!form.cpu || isNaN(parseInt(form.cpu))) {
            return showToast('CPU limit wajib diisi.', 'error');
        }
        if (!form.ram_mb || isNaN(parseInt(form.ram_mb))) {
            return showToast('Memory (RAM) wajib diisi.', 'error');
        }
        if (!form.disk_mb || isNaN(parseInt(form.disk_mb))) {
            return showToast('Disk wajib diisi.', 'error');
        }

        setLoading(true);
        const payload = {
            ...form,
            price_monthly: parseInt(form.price_monthly),
            cpu: parseInt(form.cpu),
            ram_mb: parseInt(form.ram_mb),
            disk_mb: parseInt(form.disk_mb),
            swap_mb: parseInt(form.swap_mb) || 0,
            io: parseInt(form.io) || 500,
            backups: parseInt(form.backups) || 1,
            databases_count: parseInt(form.databases_count) || 1,
            allocations: parseInt(form.allocations) || 1,
            location_id: form.location_id ? parseInt(form.location_id) : null,
            node_id: form.node_id ? parseInt(form.node_id) : null,
            nest_id: form.nest_id ? parseInt(form.nest_id) : null,
            egg_id: form.egg_id ? parseInt(form.egg_id) : (plan?.egg_id || 1),
            location: locations.find(l => l.id == form.location_id)?.short || plan?.location || 'Singapore',
        };
        try {
            let data;
            if (isEdit) data = await api.put(`/admin/plans/${plan.id}`, payload);
            else data = await api.post('/admin/plans', payload);
            showToast(data?.message || 'Plan berjaya disimpan.', 'success');
            onSaved();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <Server size={16} /> {isEdit ? `Edit Plan: ${plan.name}` : 'Buat Plan Baru'}
                    </h3>
                    <button onClick={onClose} className="btn btn-secondary btn-sm !px-2">✕</button>
                </div>
                <form onSubmit={submit} className="overflow-y-auto max-h-[70vh] pr-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* FIX: FormField now defined outside PlanModal — no more remount on every render */}
                        <FormField label="Nama Plan" id="name" form={form} onChange={set} required className="col-span-2" />
                        <div className="form-group mb-0">
                            <label className="form-label text-xs uppercase">Kategori</label>
                            <input
                                list="cat-list"
                                className="form-input"
                                value={form.category}
                                onChange={e => set('category', e.target.value)}
                            />
                            <datalist id="cat-list">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <FormField label="Deskripsi" id="description" form={form} onChange={set} />
                    </div>

                    {/* Pterodactyl Settings */}
                    <div className="rounded-xl border border-accent-primary/20 bg-accent-primary/5 p-4 space-y-3">
                        <p className="text-accent-primary font-black text-sm">Pterodactyl Settings</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="form-group mb-0">
                                <label className="form-label text-xs">Location</label>
                                <select className="form-input" value={form.location_id} onChange={e => set('location_id', e.target.value)}>
                                    <option value="">-- Pilih --</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.short}</option>)}
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label text-xs">Node</label>
                                <select className="form-input" value={form.node_id} onChange={e => set('node_id', e.target.value)}>
                                    <option value="">-- Pilih --</option>
                                    {filteredNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label text-xs">Nest</label>
                                <select className="form-input" value={form.nest_id} onChange={e => set('nest_id', e.target.value)}>
                                    <option value="">-- Pilih --</option>
                                    {nests.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label text-xs">Egg</label>
                                <select className="form-input" value={form.egg_id} onChange={e => set('egg_id', e.target.value)}>
                                    <option value="">-- Pilih --</option>
                                    {/* FIX: Renamed 'e' to 'egg' to avoid shadowing the submit event parameter */}
                                    {eggs.map(egg => <option key={egg.id} value={egg.id}>{egg.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group mb-0 col-span-2">
                                <label className="form-label text-xs">Setup Type</label>
                                <select className="form-input" value={form.setup_type} onChange={e => set('setup_type', e.target.value)}>
                                    <option value="auto">Auto Provisioning</option>
                                    <option value="manual">Manual Provisioning</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="form-group mb-0">
                            <label className="form-label text-xs">Harga/bln (Rp)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.price_monthly}
                                onChange={e => set('price_monthly', e.target.value)}
                                required
                            />
                        </div>
                        {[
                            ['cpu', 'CPU Limit (%)'],
                            ['ram_mb', 'Memory (MB)'],
                            ['disk_mb', 'Disk (MB)'],
                            ['swap_mb', 'Swap (MB)'],
                            ['io', 'IO Weight'],
                            ['backups', 'Backups'],
                            ['databases_count', 'Databases'],
                            ['allocations', 'Ports']
                        ].map(([id, label]) => (
                            <div key={id} className="form-group mb-0">
                                <label className="form-label text-xs">{label}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={form[id]}
                                    onChange={e => set(id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                        {loading ? <><span className="spinner" /> Menyimpan...</> : isEdit ? 'Simpan Perubahan' : 'Buat Plan'}
                    </button>
                </form>
            </div>
        </div>
    );
}