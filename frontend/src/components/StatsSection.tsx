import StatCard from './StatCard';
import './StatsSection.css';

interface Stats {
  totalApplications: number;
  interviews: number;
  offers: number;
  rejections: number;
}

interface StatsSectionProps {
  stats: Stats | null;
}

const StatsSection = ({ stats }: StatsSectionProps) => {
  return (
    <section className="stats-section">
      <h3>Statistics</h3>
      <div className="stats-grid">
        <StatCard value={stats?.totalApplications || 0} label="Applications Sent" />
        <StatCard value={stats?.interviews || 0} label="Interviews" />
        <StatCard value={stats?.offers || 0} label="Offers" />
        <StatCard value={stats?.rejections || 0} label="Rejections" />
      </div>
    </section>
  );
};

export default StatsSection;
