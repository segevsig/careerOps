import { useState } from 'react';
import './ApplicationsList.css';

interface Application {
  id: number;
  company_name: string;
  position_title: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  applied_from:string;
}

interface ApplicationsListProps {
  applications: Application[];
  onEdit: (application: Application) => void;
  onDelete: (id: number) => void;
}

type StatusFilter = 'all' | Application['status'];

const ApplicationsList = ({ applications, onEdit, onDelete }: ApplicationsListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return '#667eea';
      case 'interview':
        return '#f59e0b';
      case 'offer':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'interview':
        return 'Interview';
      case 'offer':
        return 'Offer';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      app.company_name.toLowerCase().includes(query) ||
      app.position_title.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getEmptyMessage = () => {
    const hasAnyApplications = applications.length > 0;

    if (!hasAnyApplications) {
      return 'No applications yet. Add your first job application to get started!';
    }

    if (statusFilter !== 'all' && !searchQuery) {
      return `You don't have any applications with status "${getStatusLabel(statusFilter)}".`;
    }

    if (statusFilter !== 'all' && searchQuery) {
      return `No applications found with status "${getStatusLabel(
        statusFilter
      )}" matching "${searchQuery}".`;
    }

    if (searchQuery) {
      return `No applications found matching "${searchQuery}".`;
    }

    return 'No applications to show.';
  };

  return (
    <div className="applications-list-container">
      <div className="search-container">
        <div className="filters-row">
          <input
            type="text"
            placeholder="Search applications by company, position"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      {filteredApplications.length === 0 ? (
        <div className="applications-empty">
          <p>
            {getEmptyMessage()}
          </p>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map((app) => (
        <div key={app.id} className="application-card">
          <div className="application-header">
            <div className="application-title">
              <h3>{app.company_name}</h3>
              <span className="company-name">{app.position_title}</span>
            </div>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(app.status) }}
            >
              {getStatusLabel(app.status)}
            </span>
          </div>
          <div className="application-details">
            <div className="detail-item">
              <span className="detail-label">Applied:</span>
              <span className="detail-value">
                {new Date(app.applied_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {app.applied_from && app.applied_from !== 'unknown' && (
              <div className="applied-from">
                <span className="detail-label">applied from:</span>
                <p>{app.applied_from}</p>
              </div>
            )}
            {app.notes && (
              <div className="application-notes">
                <span className="detail-label">Notes:</span>
                <p>{app.notes}</p>
              </div>
            )}
          </div>
          <div className="application-actions">
            <button onClick={() => onEdit(app)} className="edit-button">
              Edit
            </button>
            <button onClick={() => onDelete(app.id)} className="delete-button">
              Delete
            </button>
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;


