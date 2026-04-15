import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, LayoutList, Image as ImageIcon } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import { MOCK_ISSUES } from './Dashboard';

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIssueDetails = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 800));

                // Mock API call to get specific issue
                const localIssues = JSON.parse(localStorage.getItem('added_issues') || '[]');
                const allIssues = [...localIssues, ...MOCK_ISSUES];
                const found = allIssues.find(i => i.id.toString() === id);

                if (found) {
                    setIssue(found);
                } else {
                    // Redirect if not found
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error("Failed to fetch issue details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIssueDetails();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center min-h-[60vh]">
                <Loader className="scale-150" />
            </div>
        );
    }

    if (!issue) return null;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </Link>

            <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-gray-200/50 bg-white/40">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{issue.title}</h1>
                        <div className="self-start">
                            <StatusBadge status={issue.status} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 hover:text-gray-900">
                            <LayoutList size={16} className="text-blue-500" />
                            <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase text-xs tracking-wider">{issue.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                            <Calendar size={16} className="text-gray-400" />
                            <span>{new Date(issue.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded max-w-[200px] md:max-w-none">
                            <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{issue.locationName || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</span>
                        </div>
                    </div>
                </div>

                <div className="md:flex flex-col md:flex-row">
                    {/* Details & Image */}
                    <div className="md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100">
                        <h3 className="text-sm font-bold text-indigo-900/70 uppercase tracking-widest mb-3">Description</h3>
                        <div className="prose prose-sm text-gray-700 mb-8 bg-white/50 p-5 rounded-xl shadow-inner border border-white/60">
                            <p className="whitespace-pre-line leading-relaxed text-base">{issue.description}</p>
                        </div>

                        <h3 className="text-sm font-bold text-indigo-900/70 uppercase tracking-widest mb-3">Attached Image</h3>
                        <div className="rounded-xl overflow-hidden border border-white/60 shadow-sm bg-white/40 flex items-center justify-center min-h-[200px]">
                            {issue.image ? (
                                <a href={issue.image} target="_blank" rel="noopener noreferrer" className="block w-full">
                                    <img
                                        src={issue.image}
                                        alt={issue.title}
                                        className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity"
                                    />
                                </a>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center py-10">
                                    <ImageIcon size={32} className="mb-2 opacity-30" />
                                    <span className="text-sm">No image provided</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map Location */}
                    <div className="md:w-1/2 bg-gray-50/40 p-6 md:p-8 flex flex-col border-l border-white/50">
                        <h3 className="text-sm font-bold text-indigo-900/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" />
                            Location Map
                        </h3>
                        <div className="flex-grow rounded-xl overflow-hidden border border-white/60 shadow-md min-h-[300px]">
                            <MapComponent
                                interactive={false}
                                position={{ lat: issue.lat, lng: issue.lng }}
                                height="100%"
                            />
                        </div>
                        <div className="mt-3 text-xs text-gray-500 text-center">
                            Coordinates: {issue.lat.toFixed(6)}, {issue.lng.toFixed(6)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueDetail;
