import '../pages/Dashboard.css';

interface StatCardProps {
  value: number;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;
