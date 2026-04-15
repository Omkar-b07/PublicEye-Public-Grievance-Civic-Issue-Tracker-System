import React, { useState, useEffect } from 'react';
import { MOCK_ISSUES } from './Dashboard';
import { Building2, Search, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';

const Department = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const localIssues = JSON.parse(localStorage.getItem('added_issues') || '[]');
            const allIssues = [...localIssues, ...MOCK_ISSUES];

            // Filter strictly for this department's assigned issues
            // For mock purposes, we show all 'assigned_to_dept' issues
            const deptIssues = allIssues.filter(issue => issue.status === 'assigned_to_dept');
            setIssues(deptIssues);
        } catch (error) {
            toast.error('Failed to load department issues.');
        } finally {
            setLoading(false);
        }
    };

    const updateIssueStatus = async (id, newStatus) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            // Update state
            const updatedIssues = issues.filter(issue => issue.id !== id);

            // Update local storage
            const localIssues = JSON.parse(localStorage.getItem('added_issues') || '[]');
            const updatedLocal = localIssues.map(issue =>
                issue.id === id ? { ...issue, status: newStatus } : issue
            );
            localStorage.setItem('added_issues', JSON.stringify(updatedLocal));

            setIssues(updatedIssues);

            if (newStatus === 'resolved') {
                toast.success('Issue marked as resolved!');
            } else if (newStatus === 'late_remark') {
                toast.success('Issue flagged with late remark and sent to Senior Authority.');
            }
        } catch (error) {
            toast.error('Failed to update issue');
        }
    };

    const filteredIssues = issues.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 size={28} className="text-blue-600" />
                        Department Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and resolve civic issues assigned to your department.</p>
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
                        placeholder="Search assigned issues..."
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
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Title</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Assigned</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-500">{issue.category}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(issue.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button onClick={() => updateIssueStatus(issue.id, 'resolved')} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-xs" title="Mark Resolved">
                                                        <CheckCircle2 size={14} /> Resolve
                                                    </button>
                                                    <button onClick={() => updateIssueStatus(issue.id, 'late_remark')} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-xs" title="Flag as Late">
                                                        <AlertTriangle size={14} /> Mark Late
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            No pending issues assigned to your department.
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

export default Department;
