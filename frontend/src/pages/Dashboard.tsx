import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationsList from '../components/ApplicationsList';
import './Dashboard.css';

interface DashboardData {
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  };
  stats: {
    totalApplications: number;
    interviews: number;
    offers: number;
    rejections: number;
  };
}

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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
    fetchApplications();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error loading dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/api/applications');
      setApplications(response.data.applications);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddApplication = async (applicationData: {
    companyName: string;
    positionTitle: string;
    status: 'applied' | 'interview' | 'offer' | 'rejected';
    appliedDate: string;
    notes?: string;
  }) => {
    try {
      await api.post('/api/applications', applicationData);
      setShowForm(false);
      await fetchApplications();
      await fetchDashboardData(); // Refresh stats
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error adding application');
    }
  };

  const handleEditApplication = async (applicationData: {
    companyName: string;
    positionTitle: string;
    status: 'applied' | 'interview' | 'offer' | 'rejected';
    appliedDate: string;
    notes?: string;
  }) => {
    if (!editingApplication) return;

    try {
      await api.put(`/api/applications/${editingApplication.id}`, applicationData);
      setEditingApplication(null);
      setShowForm(false);
      await fetchApplications();
      await fetchDashboardData(); // Refresh stats
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error updating application');
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await api.delete(`/api/applications/${id}`);
      await fetchApplications();
      await fetchDashboardData(); // Refresh stats
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error deleting application');
    }
  };

  const openEditForm = (application: Application) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingApplication(null);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const displayName = dashboardData?.user.firstName
    ? `${dashboardData.user.firstName} ${dashboardData.user.lastName || ''}`.trim()
    : dashboardData?.user.email || 'User';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>CareerOps</h1>
        <div className="header-actions">
          <span className="user-name">Hello, {displayName}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h2>Welcome to Your Dashboard!</h2>
          <p>Here you can manage your entire job search process</p>
        </section>

        <section className="stats-section">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{dashboardData?.stats.totalApplications || 0}</div>
              <div className="stat-label">Applications Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{dashboardData?.stats.interviews || 0}</div>
              <div className="stat-label">Interviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{dashboardData?.stats.offers || 0}</div>
              <div className="stat-label">Offers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{dashboardData?.stats.rejections || 0}</div>
              <div className="stat-label">Rejections</div>
            </div>
          </div>
        </section>
        <section className="applications-section">
          <div className="section-header">
            <h3>Job Applications</h3>
            <button onClick={() => setShowForm(true)} className="add-button">
              + Add Application
            </button>
          </div>
          <ApplicationsList
            applications={applications}
            onEdit={openEditForm}
            onDelete={handleDeleteApplication}
          />
        </section>
        <section className="info-section">
          <h3>Personal Information</h3>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{dashboardData?.user.email}</span>
            </div>
            {dashboardData?.user.firstName && (
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{displayName}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Join Date:</span>
              <span className="info-value">
                {new Date(dashboardData?.user.createdAt || '').toLocaleDateString('en-US')}
              </span>
            </div>
          </div>
        </section>
      </main>

      {showForm && (
        <ApplicationForm
          application={
            editingApplication
              ? {
                  id: editingApplication.id,
                  companyName: editingApplication.company_name,
                  positionTitle: editingApplication.position_title,
                  status: editingApplication.status,
                  appliedDate: editingApplication.applied_date,
                  notes: editingApplication.notes,
                }
              : null
          }
          onSubmit={editingApplication ? handleEditApplication : handleAddApplication}
          onCancel={closeForm}
        />
      )}
    </div>
  );
};

export default Dashboard;

