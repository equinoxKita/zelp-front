import { useState } from 'react';
import { Zap, Users, Package, FileText, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import Swal from 'sweetalert2';

const ACTIONS = [
    {
        id: 'sync_servers',
        icon: RefreshCw,
        label: 'Sync Server Status',
        desc: 'Sinkronisasi status semua server dengan Pterodactyl',
        color: '#42C8F5',
        endpoint: '/admin/bulk/sync-servers',
        method: 'post',
        confirm: 'Sinkronisasi status semua server? Ini mungkin membutuhkan waktu.',
    },
    {
        id: 'suspend_expired',
        icon: Package,
        label: 'Suspend Expired Services',
        desc: 'Suspend semua service yang sudah melewati tanggal expired',
        color: '#42C8F5',
        endpoint: '/admin/bulk/suspend-expired',
        method: 'post',
        confirm: 'Suspend semua service yang sudah expired?',
    },
    {
        id: 'remind_expiring',
        icon: AlertTriangle,
        label: 'Send Expiry Reminders',
        desc: 'Kirim email reminder ke user yang servis-nya akan expired dalam 7 hari',
        color: '#42C8F5',
        endpoint: '/admin/bulk/send-reminders',
        method: 'post',
        confirm: 'Kirim email reminder ke semua user dengan service expiring dalam 7 hari?',
    },
    {
        id: 'recalc_balances',
        icon: FileText,
        label: 'Recalculate Pending Invoices',
        desc: 'Cek dan perbarui semua invoice yang masih pending',
        color: '#42C8F5',
        endpoint: '/admin/bulk/recalculate-invoices',
        method: 'post',
        confirm: 'Recalculate semua pending invoices?',
    },
    {
        id: 'cleanup_tokens',
        icon: Users,
        label: 'Cleanup Expired Tokens',
        desc: 'Hapus semua session token yang sudah kadaluarsa dari database',
        color: '#42C8F5',
        endpoint: '/admin/bulk/cleanup-tokens',
        method: 'post',
        confirm: 'Hapus semua expired session tokens?',
    },
];

const SHIROKO_CYAN = '#42C8F5';
const SHIROKO_BLUE = '#1e293b';

export default function BulkActions() {
    const showToast = useToast();
    const [running, setRunning] = useState({});
    const [results, setResults] = useState({});

    const run = async (action) => {
        const result = await Swal.fire({
            title: action.label,
            text: action.confirm,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: SHIROKO_CYAN,
            cancelButtonColor: '#334155',
            confirmButtonText: 'Ya, Jalankan!',
            cancelButtonText: 'Batal',
            background: '#0F172A',
            color: '#f8fafc',
            customClass: {
                popup: 'rounded-[2rem] border-2 border-[#42C8F5]/30 shadow-[0_20px_50px_rgba(66,200,245,0.2)] backdrop-blur-xl',
                title: 'font-black tracking-tighter text-2xl uppercase',
                confirmButton: 'rounded-2xl font-black px-8 py-4 uppercase tracking-widest text-sm',
                cancelButton: 'rounded-2xl font-bold px-8 py-4 uppercase tracking-widest text-sm opacity-50'
            }
        });

        if (!result.isConfirmed) return;

        setRunning(r => ({ ...r, [action.id]: true }));
        setResults(r => ({ ...r, [action.id]: null }));
        try {
            const data = action.method === 'post'
                ? await api.post(action.endpoint)
                : await api.get(action.endpoint);
            
            await Swal.fire({
                title: 'COMPLETE!',
                text: data.message || 'Mission Objective Accomplished',
                icon: 'success',
                iconColor: SHIROKO_CYAN,
                timer: 4000,
                timerProgressBar: true,
                background: '#0F172A',
                color: '#f8fafc',
                confirmButtonColor: SHIROKO_CYAN,
                customClass: {
                    popup: 'rounded-[2rem] border-2 border-[#42C8F5]/30',
                    title: 'font-black tracking-tighter'
                }
            });

            setResults(r => ({ ...r, [action.id]: { ok: true, msg: data.message || 'Selesai' } }));
        } catch (err) {
            await Swal.fire({
                title: 'FAILED',
                text: err.message,
                icon: 'error',
                background: '#0F172A',
                color: '#f8fafc',
                confirmButtonColor: '#ef4444',
                customClass: {
                    popup: 'rounded-[2rem] border-2 border-red-500/30'
                }
            });
            setResults(r => ({ ...r, [action.id]: { ok: false, msg: err.message } }));
        } finally {
            setRunning(r => ({ ...r, [action.id]: false }));
        }
    };

    return (
        <div className="space-y-4">
            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning/10 border border-warning/20 text-warning">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <strong className="font-black">Perhatian:</strong> Operasi di bawah ini berjalan secara massal dan tidak dapat dibatalkan. Pastikan kamu memahami dampaknya sebelum menjalankan.
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                {ACTIONS.map(action => {
                    const Icon = action.icon;
                    const isRunning = running[action.id];
                    const result = results[action.id];
                    return (
                        <div key={action.id} className="card p-6 flex items-start gap-4 relative overflow-hidden"
                            style={{ border: `1px solid ${action.color}15` }}>
                            <div className="absolute -bottom-6 -right-6 opacity-[0.04]" style={{ color: action.color }}>
                                <Icon size={96} />
                            </div>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border"
                                style={{ background: `${action.color}15`, color: action.color, borderColor: `${action.color}30` }}>
                                <Icon size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-text-primary mb-1">{action.label}</div>
                                <div className="text-xs text-text-muted mb-3">{action.desc}</div>
                                {result && (
                                    <div className={`flex items-center gap-2 text-xs font-bold mb-3 ${result.ok ? 'text-success' : 'text-danger'}`}>
                                        {result.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                                        {result.msg}
                                    </div>
                                )}
                                <button
                                    onClick={() => run(action)}
                                    disabled={isRunning}
                                    className="btn btn-secondary px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-60"
                                    style={isRunning ? {} : { borderColor: `${action.color}40`, color: action.color }}
                                >
                                    {isRunning
                                        ? <><RefreshCw size={14} className="animate-spin" /> Running...</>
                                        : <><Zap size={14} /> Execute</>
                                    }
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
