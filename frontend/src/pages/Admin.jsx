import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Search, Trash2, Check, X, AlertCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import {
    fetchAdminIssues, verifyIssue, rejectIssue,
    adminDeleteIssue, checkDuplicates, adminUpdateStatus,
    fetchDepartments, assignIssue
} from '../api/issuesApi';

const PRIORITY_COLORS = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
};

const Admin = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [duplicateResult, setDuplicateResult] = useState(null);
    const [checkingDupId, setCheckingDupId] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [assigningId, setAssigningId] = useState(null);

    useEffect(() => {
        fetchDepartments().then(setDepartments).catch(() => {});
    }, []);

    const loadIssues = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (statusFilter) params.status = statusFilter;
            const data = await fetchAdminIssues(params);
            setIssues(data);
        } catch (err) {
            toast.error('Failed to load issues. Make sure you are logged in as admin.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter]);

    useEffect(() => {
        const t = setTimeout(loadIssues, 350);
        return () => clearTimeout(t);
    }, [loadIssues]);

    const handleVerify = async (id) => {
        try {
            const updated = await verifyIssue(id);
            setIssues(prev => prev.map(i => i.id === id ? updated : i));
            toast.success('Issue verified ✅');
        } catch { toast.error('Failed to verify issue'); }
    };

    const handleReject = async (id) => {
        try {
            const updated = await rejectIssue(id);
            setIssues(prev => prev.map(i => i.id === id ? updated : i));
            toast.success('Issue rejected ❌');
        } catch { toast.error('Failed to reject issue'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this issue? This cannot be undone.')) return;
        try {
            await adminDeleteIssue(id);
            setIssues(prev => prev.filter(i => i.id !== id));
            toast.success('Issue deleted');
        } catch { toast.error('Failed to delete issue'); }
    };

    const handleAssign = async (issueId, deptId) => {
        if (!deptId) return;
        setAssigningId(issueId);
        try {
            const updated = await assignIssue(issueId, deptId);
            setIssues(prev => prev.map(i => i.id === issueId ? updated : i));
            toast.success('Assigned to department! 🏢');
        } catch {
            toast.error('Failed to assign issue');
        } finally {
            setAssigningId(null);
        }
    };

    const handleCheckDuplicates = async (id) => {
        setCheckingDupId(id);
        setDuplicateResult(null);
        try {
            const result = await checkDuplicates(id);
            setDuplicateResult(result);
            if (result.count === 0) {
                toast.success('No duplicates found near this issue');
            } else {
                toast(`Found ${result.count} potential duplicate(s)`, { icon: '⚠️' });
            }
        } catch { toast.error('Duplicate check failed'); }
        finally { setCheckingDupId(null); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert size={28} className="text-blue-600" />
                    Admin Dashboard
                </h1>
                <p className="text-gray-500 text-sm mt-1">Review, verify, or reject all submitted civic complaints.</p>
            </div>

            {/* Duplicate Result Banner */}
            {duplicateResult && (
                <div className={`glass-card p-4 rounded-2xl border-l-4 animate-fade-in ${duplicateResult.count > 0 ? 'border-l-orange-500 bg-orange-50/60' : 'border-l-green-500 bg-green-50/60'}`}>
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className={duplicateResult.count > 0 ? 'text-orange-500 mt-0.5' : 'text-green-500 mt-0.5'} />
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                                {duplicateResult.count > 0
                                    ? `⚠️ ${duplicateResult.count} potential duplicate(s) detected nearby`
                                    : '✅ No duplicates detected'}
                            </p>
                            {duplicateResult.duplicates?.map(d => (
                                <p key={d.id} className="text-sm text-gray-600 mt-1">• {d.title} ({d.status})</p>
                            ))}
                        </div>
                        <button onClick={() => setDuplicateResult(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 bg-white/60 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white sm:text-sm transition-all"
                        placeholder="Search by title or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white/60 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 sm:text-sm"
                >
                    <option value="">All Statuses</option>
                    {['PENDING', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
                {loading ? (
                    <div className="h-64 flex items-center justify-center"><Loader /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200/50">
                            <thead className="bg-white/40 border-b border-gray-200/50">
                                <tr>
                                    {['Issue', 'Category', 'Priority', 'Date', 'Status', 'Actions'].map(h => (
                                        <th key={h} scope="col" className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/50">
                                {issues.length > 0 ? issues.map((issue) => (
                                    <tr key={issue.id} className="hover:bg-white/60 transition-colors duration-150">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {issue.image_url ? (
                                                    <img className="h-10 w-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                                        src={`http://localhost:8000${issue.image_url}`} alt="" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">No img</div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{issue.title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{issue.address || `${issue.latitude?.toFixed(3)}, ${issue.longitude?.toFixed(3)}`}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{issue.category}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.MEDIUM}`}>
                                                {issue.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(issue.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                {issue.status === 'VERIFIED' && (
                                                    <select
                                                        onChange={(e) => handleAssign(issue.id, e.target.value)}
                                                        disabled={assigningId === issue.id}
                                                        className="text-xs px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 outline-none cursor-pointer"
                                                        value=""
                                                    >
                                                        <option value="" disabled>{assigningId === issue.id ? '...' : 'Assign Dept'}</option>
                                                        {departments.map(d => (
                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {!issue.is_verified && !issue.is_rejected && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerify(issue.id)}
                                                            className="text-green-600 hover:text-white hover:bg-green-600 bg-green-50 p-1.5 rounded-lg transition-colors border border-green-200"
                                                            title="Verify Issue"
                                                        >
                                                            <Check size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(issue.id)}
                                                            className="text-red-600 hover:text-white hover:bg-red-600 bg-red-50 p-1.5 rounded-lg transition-colors border border-red-200"
                                                            title="Reject Issue"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleCheckDuplicates(issue.id)}
                                                    disabled={checkingDupId === issue.id}
                                                    className="text-purple-600 hover:text-white hover:bg-purple-600 bg-purple-50 p-1.5 rounded-lg transition-colors border border-purple-200 disabled:opacity-50"
                                                    title="Check for Duplicates"
                                                >
                                                    <Copy size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(issue.id)}
                                                    className="text-gray-600 hover:text-white hover:bg-gray-600 bg-gray-50 p-1.5 rounded-lg transition-colors border border-gray-200"
                                                    title="Delete Issue"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No issues found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
