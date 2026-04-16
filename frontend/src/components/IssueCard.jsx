import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Image as ImageIcon, ThumbsUp, Flag } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { upvoteIssue } from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PRIORITY_DOT = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-yellow-400',
    LOW: 'bg-green-500',
};

const IssueCard = ({ issue, onUpvoteChange }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [localUpvotes, setLocalUpvotes] = useState(issue.upvotes || 0);
    const [hasVoted, setHasVoted] = useState(issue.user_has_upvoted || false);
    const [upvoting, setUpvoting] = useState(false);

    const handleUpvote = async (e) => {
        e.stopPropagation(); // Don't navigate to detail
        if (!user) {
            toast.error('Please log in to upvote');
            return;
        }
        if (upvoting) return;
        setUpvoting(true);
        try {
            const result = await upvoteIssue(issue.id);
            setLocalUpvotes(result.upvotes);
            setHasVoted(result.user_has_upvoted);
            if (onUpvoteChange) onUpvoteChange(issue.id, result.upvotes, result.user_has_upvoted);
        } catch {
            toast.error('Failed to upvote');
        } finally {
            setUpvoting(false);
        }
    };

    // Build image src — backend images have paths like /static/uploads/...
    const imageSrc = issue.image_url
        ? (issue.image_url.startsWith('http') ? issue.image_url : `http://localhost:8000${issue.image_url}`)
        : null;

    return (
        <div
            onClick={() => navigate(`/issue/${issue.id}`)}
            className="glass-card overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col h-full border border-white/60 relative"
        >
            {/* Image Area */}
            <div className="relative h-48 w-full bg-gray-100/50 overflow-hidden flex-shrink-0">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={issue.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-sm">No image available</span>
                    </div>
                )}
                {/* Status badge */}
                <div className="absolute top-3 right-3">
                    <StatusBadge status={issue.status} />
                </div>
                {/* Priority dot */}
                {issue.priority && (
                    <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-black/40 backdrop-blur-sm`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[issue.priority] || 'bg-yellow-400'}`} />
                            {issue.priority}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-md shadow-sm">
                        {issue.category}
                    </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {issue.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                    {issue.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-1 truncate max-w-[130px]">
                        <MapPin size={13} />
                        <span className="truncate">
                            {issue.address || (issue.latitude ? `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}` : 'Location')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-gray-400">
                            <Calendar size={13} />
                            {new Date(issue.created_at).toLocaleDateString()}
                        </span>

                        {/* Upvote button */}
                        <button
                            onClick={handleUpvote}
                            disabled={upvoting}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                                hasVoted
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                            } ${upvoting ? 'opacity-50' : ''}`}
                            title={hasVoted ? 'Remove upvote' : 'Upvote this issue'}
                        >
                            <ThumbsUp size={11} className={hasVoted ? 'fill-blue-500 text-blue-500' : ''} />
                            {localUpvotes}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueCard;
