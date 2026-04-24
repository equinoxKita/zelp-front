import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

export function Cancellations() {
    const showToast = useToast();
    const [pendingCancellations, setPendingCancellations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCancellation, setSelectedCancellation] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [adminNote, setAdminNote] = useState('');

    const fetchPendingCancellations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get('/admin/cancel-requests');
            setPendingCancellations(data.requests || []);
        } catch (error) {
            console.error('Error fetching cancellations:', error);
            showToast('Failed to load cancellations', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPendingCancellations();
    }, [fetchPendingCancellations]);

    const handleApprove = async (cancellationId, orderId) => {
        try {
            const data = await api.patch(`/admin/cancel-requests/${cancellationId}`, {
                action: 'approve',
                refund_amount: parseFloat(refundAmount) || 0,
                admin_note: adminNote
            });
            showToast('Cancellation approved successfully', 'success');
            fetchPendingCancellations();
            setSelectedCancellation(null);
            setRefundAmount('');
            setAdminNote('');
        } catch (error) {
            console.error('Error approving cancellation:', error);
            showToast(error.message || 'Failed to approve cancellation', 'error');
        }
    };

    const handleReject = async (cancellationId, reason) => {
        try {
            const data = await api.patch(`/admin/cancel-requests/${cancellationId}`, { 
                action: 'reject',
                admin_note: reason 
            });
            showToast('Cancellation rejected successfully', 'success');
            fetchPendingCancellations();
            setSelectedCancellation(null);
        } catch (error) {
            console.error('Error rejecting cancellation:', error);
            showToast(error.message || 'Failed to reject cancellation', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary">Cancellations</h2>
                        <p className="text-xs text-text-muted mt-1 uppercase font-bold">
                            Manage pending cancellation requests
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="badge badge-secondary">{pendingCancellations.length} pending</span>
                    </div>
                </div>

                {pendingCancellations.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-text-muted mb-4 font-bold">✓ No pending cancellation requests</div>
                        <p className="text-xs text-text-muted">
                            Orders will be automatically approved after 24 hours if no action is taken
                        </p>
                    </div>
                ) : (
                    <div className="p-6 grid gap-4">
                        {pendingCancellations.map((cancellation) => (
                            <div key={cancellation._id || cancellation.id} className="card p-6 hover:shadow-lg transition-shadow border border-white/5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-text-primary">
                                                Cancellation Request #{String(cancellation._id || cancellation.id).slice(-6).toUpperCase()}
                                            </h3>
                                            <span className="badge badge-danger">Pending</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl">
                                            <div>
                                                <p className="text-xs text-text-muted uppercase font-bold mb-1">Service ID</p>
                                                <p className="font-medium text-text-primary">#{cancellation.service_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted uppercase font-bold mb-1">Customer</p>
                                                <p className="font-medium text-text-primary">{cancellation.user_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted uppercase font-bold mb-1">Requested At</p>
                                                <p className="font-medium text-text-primary">
                                                    {new Date(cancellation.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-text-muted uppercase font-bold mb-1">Reason</p>
                                                <p className="font-medium text-text-primary">{cancellation.reason}</p>
                                            </div>
                                        </div>

                                        {selectedCancellation && (selectedCancellation._id === cancellation._id || selectedCancellation.id === cancellation.id) && (
                                            <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="form-group">
                                                        <label htmlFor="refund-amount" className="form-label">Refund Amount (Rp)</label>
                                                        <input
                                                            id="refund-amount"
                                                            type="number"
                                                            className="form-input"
                                                            value={refundAmount}
                                                            onChange={(e) => setRefundAmount(e.target.value)}
                                                            placeholder="e.g., 15000"
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor="admin-note" className="form-label">Admin Note / Refund Reason</label>
                                                        <textarea
                                                            id="admin-note"
                                                            className="form-input"
                                                            value={adminNote}
                                                            onChange={(e) => setAdminNote(e.target.value)}
                                                            placeholder="Opsional: Kenapa ditolak? / Info refund"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => setSelectedCancellation(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleReject(cancellation._id || cancellation.id, adminNote || 'No reason provided')}
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleApprove(cancellation.id)}
                                                    >
                                                        Approve & Terminate
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {(!selectedCancellation || (selectedCancellation._id !== cancellation._id && selectedCancellation.id !== cancellation.id)) && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setSelectedCancellation(cancellation)}
                                        >
                                            Manage
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cancellations;
