import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import StatusBadge from './StatusBadge';

const IssueCard = ({ issue }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/issue/${issue.id}`)}
            className="glass-card overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col h-full border border-white/60 relative"
        >
            <div className="relative h-48 w-full bg-gray-100/50 overflow-hidden">
                {issue.image ? (
                    <img
                        src={issue.image}
                        alt={issue.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-sm">No image available</span>
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <StatusBadge status={issue.status} />
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-md shadow-sm">
                        {issue.category}
                    </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {issue.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">
                    {issue.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="truncate max-w-[120px]">{issue.locationName || 'Location attached'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueCard;
