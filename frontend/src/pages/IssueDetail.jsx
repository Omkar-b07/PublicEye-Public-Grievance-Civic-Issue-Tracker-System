import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, LayoutList, ThumbsUp, Flag, Star } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import { fetchIssue, upvoteIssue, submitIssueFeedback } from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PRIORITY_CONFIG = {
    HIGH: { label: 'High Priority', cls: 'bg-red-100 text-red-700 border-red-200' },
    MEDIUM: { label: 'Medium Priority', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    LOW: { label: 'Low Priority', cls: 'bg-green-100 text-green-700 border-green-200' },
};

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upvoting, setUpvoting] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchIssue(id);
                setIssue(data);
            } catch {
                toast.error('Issue not found');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    const handleUpvote = async () => {
        if (!user) {
            toast.error('Please log in to upvote issues.');
            return;
        }
        if (upvoting) return;
        setUpvoting(true);
        try {
            const result = await upvoteIssue(id);
            setIssue(prev => ({
                ...prev,
                upvotes: result.upvotes,
                user_has_upvoted: result.user_has_upvoted,
            }));
            toast.success(result.user_has_upvoted ? 'Upvoted! 👍' : 'Upvote removed');
        } catch {
            toast.error('Failed to upvote');
        } finally {
            setUpvoting(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            toast.error('Please select a star rating.');
            return;
        }
        setSubmittingFeedback(true);
        try {
            const updated = await submitIssueFeedback(id, { rating, text: feedbackText });
            setIssue(updated);
            toast.success('Feedback submitted successfully!');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit feedback');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center min-h-[60vh]"><Loader /></div>;
    }
    if (!issue) return null;

    const priority = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.MEDIUM;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft size={16} />
                Back to Dashboard
            </Link>

            <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-200/50 bg-white/40">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{issue.title}</h1>
                        <div className="flex flex-col items-start gap-2">
                            <StatusBadge status={issue.status} />
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${priority.cls}`}>
                                <Flag size={11} />
                                {priority.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded">
                            <LayoutList size={14} className="text-blue-500" />
                            <span className="font-medium text-blue-700 text-xs uppercase tracking-wider">{issue.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{new Date(issue.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        {(issue.address || issue.latitude) && (
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded max-w-xs">
                                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{issue.address || `${issue.latitude?.toFixed(5)}, ${issue.longitude?.toFixed(5)}`}</span>
                            </div>
                        )}

                        {/* Upvote button */}
                        <button
                            onClick={handleUpvote}
                            disabled={upvoting}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                                issue.user_has_upvoted
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                            } ${upvoting ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <ThumbsUp size={14} />
                            {issue.upvotes} {issue.upvotes === 1 ? 'upvote' : 'upvotes'}
                        </button>
                    </div>
                </div>

                <div className="md:flex flex-col md:flex-row">
                    {/* Description & Image */}
                    <div className="md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-100">
                        <h3 className="text-xs font-bold text-indigo-900/70 uppercase tracking-widest mb-3">Description</h3>
                        <div className="prose prose-sm text-gray-700 mb-8 bg-white/50 p-5 rounded-xl shadow-inner border border-white/60">
                            <p className="whitespace-pre-line leading-relaxed">{issue.description}</p>
                        </div>

                        {issue.image_url && (
                            <>
                                <h3 className="text-xs font-bold text-indigo-900/70 uppercase tracking-widest mb-3">Attached Image</h3>
                                <a
                                    href={`http://localhost:8000${issue.image_url}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="block rounded-xl overflow-hidden border border-white/60 shadow-sm"
                                >
                                    <img
                                        src={`http://localhost:8000${issue.image_url}`}
                                        alt={issue.title}
                                        className="w-full h-auto max-h-[400px] object-cover hover:opacity-90 transition-opacity"
                                    />
                                </a>
                            </>
                        )}

                        {issue.resolved_at && (
                            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-sm text-green-700 font-medium">
                                    ✅ Resolved on {new Date(issue.resolved_at).toLocaleString()}
                                </p>
                            </div>
                        )}
                        
                        {/* Feedback Section */}
                        {issue.status === 'RESOLVED' && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h3 className="text-xs font-bold text-indigo-900/70 uppercase tracking-widest mb-3">User Feedback</h3>
                                
                                {issue.feedback_rating ? (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
                                        <div className="flex items-center gap-1 mb-2">
                                            {[1,2,3,4,5].map(star => (
                                                <Star key={star} size={16} className={star <= issue.feedback_rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                            ))}
                                            <span className="ml-2 text-sm font-semibold text-yellow-800">{issue.feedback_rating}/5 Rating</span>
                                        </div>
                                        {issue.feedback_text && (
                                            <p className="text-sm text-gray-700 italic border-l-2 border-yellow-300 pl-3 py-1">"{issue.feedback_text}"</p>
                                        )}
                                    </div>
                                ) : (user && user.id === issue.created_by) ? (
                                    <form onSubmit={handleFeedbackSubmit} className="bg-white/60 p-4 rounded-xl border border-gray-200/60 shadow-sm">
                                        <p className="text-sm text-gray-600 mb-3">How was your experience getting this resolved?</p>
                                        <div className="flex items-center gap-2 mb-4">
                                            {[1,2,3,4,5].map(star => (
                                                <button 
                                                    key={star} type="button" 
                                                    onClick={() => setRating(star)} 
                                                    className="focus:outline-none transition-transform hover:scale-110 focus:scale-110 active:scale-95"
                                                >
                                                    <Star size={24} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                                            placeholder="Leave a comment (optional)..."
                                            className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3 bg-white"
                                            rows="2"
                                        />
                                        <button 
                                            type="submit" disabled={submittingFeedback}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                        </button>
                                    </form>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No feedback provided yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className="md:w-1/2 bg-gray-50/40 p-6 md:p-8 flex flex-col">
                        <h3 className="text-xs font-bold text-indigo-900/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MapPin size={14} className="text-blue-500" />
                            Location Map
                        </h3>
                        <div className="flex-grow rounded-xl overflow-hidden border border-white/60 shadow-md min-h-[300px]">
                            <MapComponent
                                issues={[{ lat: issue.latitude, lng: issue.longitude, title: issue.title }]}
                                height="100%"
                            />
                        </div>
                        <div className="mt-3 text-xs text-gray-500 text-center">
                            GPS: {issue.latitude?.toFixed(6)}, {issue.longitude?.toFixed(6)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueDetail;
