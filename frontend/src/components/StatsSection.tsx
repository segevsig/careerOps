import { useMemo } from 'react';
import { VictoryPie, VictoryTheme, VictoryLabel } from 'victory';
import StatCard from './StatCard';
import './StatsSection.css';

interface Stats {
  totalApplications: number;
  interviews: number;
  offers: number;
  rejections: number;
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
  applied_from: string;
}

interface StatsSectionProps {
  stats: Stats | null;
  applications: Application[];
}

const StatsSection = ({ stats, applications }: StatsSectionProps) => {
  // Calculate applications sent this week
  const weeklyApplications = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    return applications.filter(app => {
      const appliedDate = new Date(app.applied_date);
      return appliedDate >= startOfWeek;
    }).length;
  }, [applications]);

  // Get encouraging or reinforcement message
  const weeklyMessage = useMemo(() => {
    if (weeklyApplications < 10) {
      return "Keep up the momentum! Every application brings you closer to your dream job. 💪";
    } else {
      return "Outstanding effort! You're showing incredible dedication to your job search. 🚀";
    }
  }, [weeklyApplications]);

  // Calculate day-of-week distribution
  const dayOfWeekData = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts: Record<string, number> = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };

    applications.forEach(app => {
      const date = new Date(app.applied_date);
      const dayName = dayNames[date.getDay()];
      dayCounts[dayName]++;
    });

    const total = Object.values(dayCounts).reduce((sum, count) => sum + count, 0);
    
    return dayNames.map(day => {
      const count = dayCounts[day];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        x: day.substring(0, 3),
        y: count,
        label: `${day.substring(0, 3)}\n${percentage}%`,
        fullDay: day
      };
    });
  }, [applications]);

  // Calculate applied_from distribution
  const appliedFromData = useMemo(() => {
    const sourceCounts: Record<string, number> = {};

    applications.forEach(app => {
      const source = app.applied_from || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const total = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(sourceCounts)
      .map(([source, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return {
          x: source.length > 10 ? source.substring(0, 10) : source,
          y: count,
          label: `${source.length > 10 ? source.substring(0, 10) : source}\n${percentage}%`,
          fullSource: source
        };
      })
      .sort((a, b) => b.y - a.y); // Sort by count descending
  }, [applications]);

  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];

  return (
    <section className="stats-section">
      <h3>Statistics</h3>
      
      {/* Main stats grid */}
      <div className="stats-grid">
        <StatCard value={stats?.totalApplications || 0} label="Applications Sent" />
        <StatCard value={stats?.interviews || 0} label="Interviews" />
        <StatCard value={stats?.offers || 0} label="Offers" />
        <StatCard value={stats?.rejections || 0} label="Rejections" />
      </div>

      {/* Weekly applications statistic - full width on top */}
      <div className="weekly-stat-card">
        <div className="weekly-stat-header">
          <h4>you send {weeklyApplications} Applications This Week</h4>
        </div>
        <p className="weekly-stat-message">{weeklyMessage}</p>
      </div>

      {/* Two pie charts side by side */}
      <div className="pie-charts-container">
        {/* Day of week pie chart */}
        <div className="chart-container">
          <h4 className="chart-title">Applications by Day of Week</h4>
          {dayOfWeekData.some(item => item.y > 0) ? (
            <>
              <div className="pie-chart-wrapper">
                <VictoryPie
                  data={dayOfWeekData.filter(item => item.y > 0)}
                  colorScale={colors}
                  theme={VictoryTheme.material}
                  width={220}
                  height={220}
                  labelComponent={<VictoryLabel style={{ fontSize: 9, fill: '#333' }} />}
                  style={{
                    labels: { fill: '#333', fontSize: 9, fontWeight: 'bold' }
                  }}
                />
              </div>
              <div className="chart-legend">
                {dayOfWeekData.map((item, index) => {
                  const total = dayOfWeekData.reduce((sum, d) => sum + d.y, 0);
                  const percentage = total > 0 ? Math.round((item.y / total) * 100) : 0;
                  return (
                    <div key={item.fullDay} className="legend-item">
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></span>
                      <span className="legend-text">{item.fullDay}: {item.y} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="no-data-message">No applications data available yet.</p>
          )}
        </div>

        {/* Applied from pie chart */}
        <div className="chart-container">
          <h4 className="chart-title">Applications by Source</h4>
          {appliedFromData.length > 0 ? (
            <>
              <div className="pie-chart-wrapper">
                <VictoryPie
                  data={appliedFromData}
                  colorScale={colors}
                  theme={VictoryTheme.material}
                  width={220}
                  height={220}
                  labelComponent={<VictoryLabel style={{ fontSize: 9, fill: '#333' }} />}
                  style={{
                    labels: { fill: '#333', fontSize: 9, fontWeight: 'bold' }
                  }}
                />
              </div>
              <div className="chart-legend">
                {appliedFromData.map((item, index) => {
                  const total = appliedFromData.reduce((sum, d) => sum + d.y, 0);
                  const percentage = total > 0 ? Math.round((item.y / total) * 100) : 0;
                  return (
                    <div key={item.fullSource} className="legend-item">
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></span>
                      <span className="legend-text">{item.fullSource}: {item.y} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="no-data-message">No applications data available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
