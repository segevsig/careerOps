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
  applied_from:string;
}

type DailyStats = {
  date: string;
  count: number;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);

useEffect(() => {
  if (applications.length > 0) {
    const countMap: Record<string, number> = {};

    applications.forEach(job => {
      const date = job.applied_date.split("T")[0];
      if (countMap[date]) {
        countMap[date] += 1;
      } else {
        countMap[date] = 1;
      }
    });

    const stats: DailyStats[] = Object.entries(countMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailyData(stats);
  }
}, [applications]);

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
    appliedFrom: string;
    notes?: string;
  }) => {
    try {
      await api.post('/api/applications', {
        ...applicationData,
        appliedfrom: applicationData.appliedFrom, // Convert to backend format
      });
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
    appliedFrom: string;
    notes?: string;
  }) => {
    if (!editingApplication) return;

    try {
      await api.put(`/api/applications/${editingApplication.id}`, {
        ...applicationData,
        appliedfrom: applicationData.appliedFrom, // Convert to backend format
      });
      setEditingApplication(null);
      setShowForm(false);
      await fetchApplications();
      await fetchDashboardData(); // Refresh stats
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error updating application');
    }
  };

  const generateCoverLetter = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/cover-letter', {
        cvText,
        jobDescription,
        tone: "professional"
      });

      setCoverLetter(response.data.coverLetter);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
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
        <section className="cover-letter-section">
          <div className="cover-letter-box">
            <div className="cover-letter-header">
              <h3>Generate Cover Letter</h3>
              <p className="cover-letter-subtitle">AI-powered cover letter generator tailored to your CV and job description</p>
            </div>

            <div className="cover-letter-inputs">
              <div className="input-group">
                <label htmlFor="cvText">Your CV</label>
                <textarea
                  id="cvText"
                  placeholder="Paste your CV here... (resume, work experience, skills, education)"
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  rows={8}
                  className="cover-letter-textarea"
                />
              </div>

              <div className="input-group">
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  placeholder="Paste the job description here... (requirements, responsibilities, company info)"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  className="cover-letter-textarea"
                />
              </div>
            </div>

            <div className="cover-letter-actions">
              <button 
                onClick={generateCoverLetter} 
                disabled={loading || !cvText.trim() || !jobDescription.trim()}
                className="generate-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="button-icon">✨</span>
                    Generate Cover Letter
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="cover-letter-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {coverLetter && (
              <div className="cover-letter-result">
                <div className="result-header">
                  <h4>Your Generated Cover Letter</h4>
                  <button 
                    onClick={() => navigator.clipboard.writeText(coverLetter)}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="result-content">
                  <pre>{coverLetter}</pre>
                </div>
              </div>
            )}
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
                  appliedFrom:editingApplication.applied_from,
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

