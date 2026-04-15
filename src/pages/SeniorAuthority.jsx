import React, { useState, useEffect } from 'react';
import { getIssues } from '../utils/storage';
import { Megaphone, MessageSquare, Clock, MapPin, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';

const SeniorAuthority = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const allIssues = getIssues();

            // Only show issues marked as late_remark
            const lateIssues = allIssues.filter(issue => issue.status === 'late_remark');
            setIssues(lateIssues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            toast.error('Failed to load senior authority feed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col items-center text-center mb-8 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-500/30 ring-4 ring-white">
                    <Megaphone size={36} />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900">Public Accountability Feed</h1>
                <p className="text-gray-500 mt-2 max-w-lg">
                    Official public dashboard for Senior Authorities to review unresolved or heavily delayed civic issues marked with a late remark.
                </p>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader />
                </div>
            ) : issues.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-2xl animate-slide-up">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
                    <p className="text-gray-500 mt-2">There are currently no delayed issues requiring senior authority intervention.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {issues.map((issue, index) => (
                        <div
                            key={issue.id}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl">
                                        !
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{issue.title}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                            <span className="font-medium text-blue-600">{issue.category}</span>
                                            <span>•</span>
                                            <Clock size={12} />
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={issue.status} />
                            </div>

                            <p className="text-gray-700 mb-4 whitespace-pre-line">{issue.description}</p>

                            {issue.image && (
                                <div className="mb-4 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                                    <img
                                        src={issue.image}
                                        alt="Issue verification"
                                        className="w-full h-auto max-h-96 object-contain"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4 text-sm">
                                <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <MapPin size={16} className="text-gray-400" />
                                    {issue.locationName || 'Location Provided'}
                                </span>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                                        <MessageSquare size={16} /> Comment
                                    </button>
                                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                                        <Share2 size={16} /> Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SeniorAuthority;
