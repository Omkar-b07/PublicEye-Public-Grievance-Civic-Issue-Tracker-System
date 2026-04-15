import React, { useState, useEffect } from 'react';
import { MOCK_ISSUES } from './Dashboard';
import { ShieldAlert, Search, Trash2, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';

const Admin = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editStatus, setEditStatus] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const localIssues = JSON.parse(localStorage.getItem('added_issues') || '[]');
            setIssues([...localIssues, ...MOCK_ISSUES]);
        } catch (error) {
            toast.error('Failed to load issues for admin.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChangeStart = (issue) => {
        setEditingId(issue.id);
        setEditStatus(issue.status);
    };

    const handleStatusSave = async (id) => {
        try {
            // In a real app: await api.patch(`/issues/${id}`, { status: editStatus });
            await new Promise(resolve => setTimeout(resolve, 500));

            const updatedIssues = issues.map(issue =>
                issue.id === id ? { ...issue, status: editStatus } : issue
            );

            // Update local storage for demo purposes
            const localIssues = JSON.parse(localStorage.getItem('added_issues') || '[]');
            const updatedLocal = localIssues.map(issue =>
                issue.id === id ? { ...issue, status: editStatus } : issue
            );
            localStorage.setItem('added_issues', JSON.stringify(updatedLocal));

            setIssues(updatedIssues);
            setEditingId(null);
            toast.success('Issue status updated successfully!');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            return;
        }

        try {
            // In a real app: await api.delete(`/issues/${id}`);
            await new Promise(resolve => setTimeout(resolve, 500));

            const updatedIssues = issues.filter(issue => issue.id !== id);

            // Update local storage
            const localIssues = JSON.parse(localStorage.getItem('added_issues') || '[]');
            const updatedLocal = localIssues.filter(issue => issue.id !== id);
            localStorage.setItem('added_issues', JSON.stringify(updatedLocal));

            setIssues(updatedIssues);
            toast.success('Issue deleted successfully');
        } catch (error) {
            toast.error('Failed to delete issue');
        }
    };

    const filteredIssues = issues.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert size={28} className="text-blue-600" />
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all submitted civic issues.</p>
                </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl animate-fade-in">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 bg-white/60 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white sm:text-sm transition-all duration-300 shadow-sm"
                        placeholder="Search by title, category, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200/50">
                            <thead className="bg-white/40 border-b border-gray-200/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Issue Title
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/50">
                                {filteredIssues.length > 0 ? (
                                    filteredIssues.map((issue) => (
                                        <tr key={issue.id} className="hover:bg-white/60 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {issue.image ? (
                                                        <img className="h-10 w-10 rounded-md object-cover mr-3 bg-gray-100 border border-gray-200" src={issue.image} alt="" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200 mr-3 flex items-center justify-center text-gray-400">
                                                            <span className="text-xs">No Img</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">{issue.title}</div>
                                                        <div className="text-sm text-gray-500 max-w-xs truncate">{issue.locationName || 'Unknown location'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">{issue.category}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(issue.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingId === issue.id ? (
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                                    >
                                                        <option value="pending_admin">Pending Admin</option>
                                                        <option value="assigned_to_dept">Approve (Assign to Dept)</option>
                                                        <option value="resolved">Resolved</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                ) : (
                                                    <StatusBadge status={issue.status} />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2">
                                                    {editingId === issue.id ? (
                                                        <>
                                                            <button onClick={() => handleStatusSave(issue.id)} className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded-md transition-colors">
                                                                <Check size={16} />
                                                            </button>
                                                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1.5 rounded-md transition-colors">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleStatusChangeStart(issue)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md transition-colors" title="Change Status">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(issue.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors" title="Delete Issue">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No issues found matching your current search.
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
