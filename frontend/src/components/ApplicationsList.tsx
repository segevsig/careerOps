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
}

interface ApplicationsListProps {
  applications: Application[];
  onEdit: (application: Application) => void;
  onDelete: (id: number) => void;
}

const ApplicationsList = ({ applications, onEdit, onDelete }: ApplicationsListProps) => {
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

  if (applications.length === 0) {
    return (
      <div className="applications-empty">
        <p>No applications yet. Add your first job application to get started!</p>
      </div>
    );
  }

  return (
    <div className="applications-list">
      {applications.map((app) => (
        <div key={app.id} className="application-card">
          <div className="application-header">
            <div className="application-title">
              <h3>{app.position_title}</h3>
              <span className="company-name">{app.company_name}</span>
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
  );
};

export default ApplicationsList;

