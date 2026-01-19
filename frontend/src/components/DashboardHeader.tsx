import './DashboardHeader.css';

interface DashboardHeaderProps {
  displayName: string;
  onLogout: () => void;
}

const DashboardHeader = ({ displayName, onLogout }: DashboardHeaderProps) => {
  return (
    <header className="dashboard-header">
      <h1>CareerOps</h1>
      <div className="header-actions">
        <span className="user-name">Hello, {displayName}</span>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
