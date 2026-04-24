import React, { useEffect, useState } from 'react';
import { X, Bell, Trash2, Check, AlertCircle, CheckCircle, Info } from 'lucide-react';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

export default function NotificationModal({ isOpen, onClose, onRefresh }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const showToast = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read');
      fetchNotifications();
      onRefresh?.();
    } catch (err) {
      showToast('Gagal memperbarui notifikasi', 'error');
    }
  };

  const deleteAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      setShowConfirmDelete(false);
      onRefresh?.();
      showToast('Semua notifikasi berhasil dihapus', 'success');
    } catch (err) {
      showToast('Gagal menghapus notifikasi', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-[#141521] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/20 text-accent-primary flex items-center justify-center font-black">
              {unreadCount}
            </div>
            <h2 className="text-xl font-black text-white">Notifikasi</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={markAllRead}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white text-xs font-bold transition-all"
            >
              Selesai
            </button>
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="px-4 py-2 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-xs font-bold transition-all"
            >
              Hapus
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="p-12 text-center text-text-muted">
              <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-text-muted flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <Bell size={32} />
              </div>
              <p className="font-bold">Belum ada notifikasi baru</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-6 flex gap-4 hover:bg-white/[0.02] transition-colors relative ${!notif.is_read ? 'bg-accent-primary/[0.01]' : ''}`}
                >
                  {!notif.is_read && (
                    <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-accent-primary" />
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center 
                    ${notif.type === 'success' ? 'bg-success/10 text-success' : 
                      notif.type === 'warning' ? 'bg-warning/10 text-warning' : 
                      notif.type === 'danger' ? 'bg-danger/10 text-danger' : 
                      'bg-accent-primary/10 text-accent-primary'}`}
                  >
                    {notif.type === 'success' ? <CheckCircle size={22} /> : 
                     notif.type === 'warning' ? <AlertCircle size={22} /> : 
                     notif.type === 'danger' ? <X size={22} /> : 
                     <Info size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white mb-1 leading-tight">{notif.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-2">{notif.message}</p>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{formatDate(notif.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowConfirmDelete(false)} />
          <div className="relative w-full max-w-xs bg-[#1a1b26] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Hapus Notifikasi?</h3>
            <p className="text-sm text-text-muted mb-6">Yakin ingin menghapus semua riwayat notifikasi Anda?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-sm transition-all"
              >
                Batal
              </button>
              <button 
                onClick={deleteAll}
                className="flex-1 px-4 py-3 rounded-2xl bg-danger hover:bg-danger/80 text-white font-black text-sm transition-all shadow-glow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
