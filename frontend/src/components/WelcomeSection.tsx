import './WelcomeSection.css';

interface User {
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface WelcomeSectionProps {
  user: User | null;
  displayName: string;
}

const WelcomeSection = ({ user, displayName }: WelcomeSectionProps) => {
  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <h2>Welcome to Your Dashboard!</h2>
        <p>Here you can manage your entire job search process</p>
      </div>
      
      <div className="info-card">
        <h3>Personal Information</h3>
        <div className="info-rows">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
          {user?.firstName && (
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{displayName}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Join Date:</span>
            <span className="info-value">
              {new Date(user?.createdAt || '').toLocaleDateString('en-US')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
