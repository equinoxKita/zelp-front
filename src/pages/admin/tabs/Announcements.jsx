import { useEffect, useState, useCallback, Fragment } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle2, XCircle, ChevronDown, Check } from 'lucide-react';
// FIX: Consolidated all headlessui imports into one line + added semicolon
import { Listbox, Transition, Checkbox } from '@headlessui/react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import Swal from 'sweetalert2'


const EMPTY_FORM = { title: '', content: '', type: 'info', is_pinned: false, is_active: true };

export default function Announcements() {
    const showToast = useToast();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // null = closed, 'new' = create mode, number = edit mode (announcement id)
    const [mode, setMode] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const d = await api.get('/announcements/admin');
            setAnnouncements(d || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setMode('new');
    };

    const startEdit = (a) => {
        setForm({
            title: a.title,
            content: a.content,
            type: a.type,
            is_pinned: !!a.is_pinned,
            is_active: !!a.is_active
        });
        setMode(a.id);
    };

    const cancelEdit = () => {
        setMode(null);
        setForm(EMPTY_FORM);
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const createAnnouncement = async () => {
        if (!form.title?.trim() || !form.content?.trim()) {
            return showToast('Title & content wajib diisi.', 'error');
        }
        setSaving(true);
        try {
            await api.post('/announcements', form);
            showToast('Announcement berjaya dibuat.', 'success');
            cancelEdit();
            load();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const updateAnnouncement = async (id) => {
        if (!form.title?.trim() || !form.content?.trim()) {
            return showToast('Title & content wajib diisi.', 'error');
        }
        setSaving(true);
        try {
            await api.put(`/announcements/${id}`, form);
            showToast('Announcement berjaya dikemaskini.', 'success');
            cancelEdit();
            load();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteAnnouncement = async (id) => {
        Swal.fire({
            title: 'Padam announcement ini?',
            text: "Anda tidak boleh undo tindakan ini!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, padam!',
            cancelButtonText: 'Batal',
            theme: 'dark'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.del(`/announcements/${id}`);
                    showToast('Announcement berjaya dipadam.', 'success');
                    load();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    };

    const toggleActive = async (id, current) => {
        try {
            await api.put(`/announcements/${id}`, { is_active: !current });
            showToast(current ? 'Announcement dinyahaktifkan.' : 'Announcement diaktifkan.', 'success');
            load();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const togglePinned = async (id, current) => {
        try {
            await api.put(`/announcements/${id}`, { is_pinned: !current });
            showToast(current ? 'Announcement dinyahpin.' : 'Announcement dipin.', 'success');
            load();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const typeColor = (t) => {
        switch (t) {
            case 'danger':  return 'text-danger bg-danger/10 border border-danger/20';
            case 'warning': return 'text-warning bg-warning/10 border border-warning/20';
            case 'success': return 'text-success bg-success/10 border border-success/20';
            default:        return 'text-info bg-info/10 border border-info/20';
        }
    };

    if (loading) return (
        <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-bg-card h-20 rounded-2xl" />)}
        </div>
    );

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                        <Megaphone size={18} />
                    </div>
                    <div>
                        <div className="font-black text-text-primary">Announcements</div>
                        <div className="text-xs text-text-muted uppercase font-bold">
                            {announcements.length} announcements
                        </div>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="btn btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
                >
                    <Plus size={16} /> Create New
                </button>
            </div>

            {/* Create Form */}
            {mode === 'new' && (
                <AnnouncementForm
                    title="Create New Announcement"
                    form={form}
                    set={set}
                    saving={saving}
                    onSubmit={createAnnouncement}
                    onCancel={cancelEdit}
                    submitLabel="Create"
                />
            )}

            {/* Empty State */}
            {announcements.length === 0 ? (
                <div className="py-20 text-center text-text-muted">
                    <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Megaphone size={32} />
                    </div>
                    <h3 className="font-bold text-text-primary mb-2">No Announcements</h3>
                    <p>Buat announcement pertama untuk memberitahu user.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="data-table w-full">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                {['Title', 'Type', 'Status', 'Pinned', 'Actions'].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`${i === 0 || i === 4 ? 'px-6' : 'px-4'} py-4 border-b-2 border-white/5 text-xs font-black text-text-muted uppercase ${i === 4 ? 'text-right' : ''}`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map(a => (
                                // FIX: key on Fragment instead of on child <tr> — React requires key on outermost element in .map()
                                <Fragment key={a.id}>
                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 border-b border-white/5">
                                            <div className="font-bold text-text-primary">{a.title}</div>
                                            <div className="text-xs text-text-muted mt-1">
                                                {a.content.substring(0, 60)}{a.content.length > 60 ? '...' : ''}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 border-b border-white/5">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${typeColor(a.type)}`}>
                                                {a.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 border-b border-white/5">
                                            <button
                                                onClick={() => toggleActive(a.id, a.is_active)}
                                                className={`btn-icon ${a.is_active ? 'text-success hover:text-danger' : 'text-text-muted hover:text-success'}`}
                                                title={a.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {a.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 border-b border-white/5">
                                            <button
                                                onClick={() => togglePinned(a.id, a.is_pinned)}
                                                className={`btn-icon ${a.is_pinned ? 'text-warning hover:text-text-muted' : 'text-text-muted hover:text-warning'}`}
                                                title={a.is_pinned ? 'Unpin' : 'Pin'}
                                            >
                                                {a.is_pinned ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 border-b border-white/5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEdit(a)}
                                                    className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20 flex items-center justify-center hover:scale-110 transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => deleteAnnouncement(a.id)}
                                                    className="w-9 h-9 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center hover:scale-110 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Edit form renders inline below the row being edited */}
                                    {mode === a.id && (
                                        <tr>
                                            <td colSpan={5} className="px-0 py-0 border-b border-white/5">
                                                <AnnouncementForm
                                                    title={`Edit: ${a.title}`}
                                                    form={form}
                                                    set={set}
                                                    saving={saving}
                                                    onSubmit={() => updateAnnouncement(a.id)}
                                                    onCancel={cancelEdit}
                                                    submitLabel="Simpan Perubahan"
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const TYPE_OPTIONS = [
    { value: 'info',    label: 'Info',    color: 'text-info' },
    { value: 'success', label: 'Success', color: 'text-success' },
    { value: 'warning', label: 'Warning', color: 'text-warning' },
    { value: 'danger',  label: 'Danger',  color: 'text-danger' },
];

function TypeSelect({ value, onChange }) {
    const selected = TYPE_OPTIONS.find(o => o.value === value) || TYPE_OPTIONS[0];

    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative">
                <Listbox.Button className="form-input w-full flex items-center justify-between gap-2 cursor-pointer">
                    <span className={`font-bold ${selected.color}`}>{selected.label}</span>
                    <ChevronDown size={14} className="text-text-muted shrink-0" />
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-50 w-full mt-1 rounded-xl border border-white/10 bg-bg-card shadow-xl overflow-hidden outline-none">
                        {TYPE_OPTIONS.map(opt => (
                            <Listbox.Option
                                key={opt.value}
                                value={opt.value}
                                className={({ active }) =>
                                    `flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm font-bold transition-colors
                                    ${active ? 'bg-white/5' : ''}
                                    ${opt.color}`
                                }
                            >
                                {({ selected: isSelected }) => (
                                    <>
                                        <span>{opt.label}</span>
                                        {isSelected && <Check size={14} />}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}

function AnnouncementForm({ title, form, set, saving, onSubmit, onCancel, submitLabel }) {
    return (
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="font-bold text-text-primary mb-4">{title}</div>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-text-muted uppercase mb-1">Title</label>
                        <input
                            className="form-input w-full"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="Announcement title"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-1">Type</label>
                        <TypeSelect value={form.type} onChange={val => set('type', val)} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Content</label>
                    <textarea
                        className="form-input w-full h-24 resize-none"
                        value={form.content}
                        onChange={e => set('content', e.target.value)}
                        placeholder="Announcement content"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        {/* FIX: onChange renamed 'e' → 'checked' — Headless UI passes boolean, not Event */}
                        {/* FIX: border-gray-300 → border-white/20 for dark theme */}
                        {/* FIX: Added Check icon inside for visible checkmark indicator */}
                        <Checkbox
                            checked={form.is_pinned}
                            onChange={checked => set('is_pinned', checked)}
                            className="w-5 h-5 rounded border-2 border-white/20 flex items-center justify-center transition-colors data-[checked]:bg-accent-primary data-[checked]:border-accent-primary"
                        >
                            {form.is_pinned && <Check size={12} className="text-white" />}
                        </Checkbox>
                        <span className="text-sm text-text-primary">Pin to top</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                            checked={form.is_active}
                            onChange={checked => set('is_active', checked)}
                            className="w-5 h-5 rounded border-2 border-white/20 flex items-center justify-center transition-colors data-[checked]:bg-accent-primary data-[checked]:border-accent-primary"
                        >
                            {form.is_active && <Check size={12} className="text-white" />}
                        </Checkbox>
                        <span className="text-sm text-text-primary">Active</span>
                    </label>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onSubmit}
                        disabled={saving}
                        className="btn btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                        {saving ? <span className="spinner" /> : <><Plus size={16} /> {submitLabel}</>}
                    </button>
                    <button onClick={onCancel} className="btn btn-secondary px-4 py-2 rounded-xl">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}