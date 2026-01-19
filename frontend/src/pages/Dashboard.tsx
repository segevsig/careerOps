import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationsList from '../components/ApplicationsList';
import DashboardHeader from '../components/DashboardHeader';
import WelcomeSection from '../components/WelcomeSection';
import JobTipsSection from '../components/JobTipsSection';
import StatsSection from '../components/StatsSection';
import CoverLetterGenerator from '../components/CoverLetterGenerator';
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
      <DashboardHeader displayName={displayName} onLogout={handleLogout} />

      <main className="dashboard-main">
        <WelcomeSection user={dashboardData?.user || null} displayName={displayName} />

        <StatsSection stats={dashboardData?.stats || null} />

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


        <CoverLetterGenerator />
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
              <JobTipsSection />

    </div>
  );
};

export default Dashboard;

