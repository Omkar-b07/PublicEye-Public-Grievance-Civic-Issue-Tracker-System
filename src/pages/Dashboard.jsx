import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import IssueCard from '../components/IssueCard';
import Loader from '../components/Loader';
import { getIssues } from '../utils/storage';

const Dashboard = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Simulate API fetch
        const fetchIssues = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 800));

                // In a real app, you would fetch from API:
                // const response = await api.get('/issues');
                // setIssues(response.data);

                setIssues(getIssues());
            } catch (error) {
                console.error("Failed to fetch issues", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, []);

    const filteredIssues = issues.filter(issue => {
        const matchesFilter = filter === 'all' || issue.status === filter;
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Overview of all civic issues in your area.</p>
                </div>

                <Link
                    to="/report"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    Report New Issue
                </Link>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
                {[
                    { label: 'Total Issues', value: issues.length, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Pending', value: issues.filter(i => i.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50/50' },
                    { label: 'In Progress', value: issues.filter(i => i.status === 'in progress').length, color: 'text-purple-600', bg: 'bg-purple-50/50' },
                    { label: 'Resolved', value: issues.filter(i => i.status === 'resolved').length, color: 'text-green-600', bg: 'bg-green-50/50' }
                ].map((stat, idx) => (
                    <div key={idx} className={`glass-card p-5 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 duration-300 border-t-4 ${stat.label === 'Pending' ? 'border-t-yellow-400' :
                        stat.label === 'In Progress' ? 'border-t-purple-400' :
                            stat.label === 'Resolved' ? 'border-t-green-400' : 'border-t-blue-400'
                        }`}>
                        <span className="text-4xl font-extrabold text-gray-800 tracking-tight">{stat.value}</span>
                        <span className={`text-sm font-semibold mt-2 ${stat.color} uppercase tracking-wider`}>{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="relative flex-grow max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 bg-white/60 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white sm:text-sm transition-all duration-300 shadow-sm"
                        placeholder="Search issues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                        className="block w-full pl-3 pr-10 py-2.5 text-base bg-white/60 border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white sm:text-sm rounded-xl border transition-all duration-300 shadow-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader />
                </div>
            ) : filteredIssues.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    {filteredIssues.map(issue => (
                        <IssueCard key={issue.id} issue={issue} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                    <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No issues found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                    <button
                        onClick={() => { setFilter('all'); setSearchQuery(''); }}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
