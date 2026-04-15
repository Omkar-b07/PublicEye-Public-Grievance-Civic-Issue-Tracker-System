import React from 'react';

const StatusBadge = ({ status }) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';

    const statusStyles = {
        pending_admin: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        assigned_to_dept: 'bg-blue-100 text-blue-800 border-blue-200',
        'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
        late_remark: 'bg-red-100 text-red-800 border-red-200',
        resolved: 'bg-green-100 text-green-800 border-green-200',
        rejected: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const displayNames = {
        pending_admin: 'Pending Admin',
        assigned_to_dept: 'Assigned (Dept)',
        late_remark: 'Late Remark',
        'in progress': 'In Progress'
    };

    const currentStyle = statusStyles[normalizedStatus] || statusStyles.pending;

    let displayText = displayNames[normalizedStatus];
    if (!displayText) {
        displayText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
            {displayText}
        </span>
    );
};

export default StatusBadge;
