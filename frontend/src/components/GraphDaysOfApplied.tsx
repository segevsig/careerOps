import React from 'react';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip, VictoryTheme } from 'victory';

type DailyStats = {
  date: string;
  count: number;
};

interface Props {
  data: DailyStats[];
}

export function DailyActivityChart({ data }: Props) {
  return (
    <div style={{
        width: "50%",
    }}>
    <div
    className="head"
    style={{
        textAlign: "center",
        marginTop: "3rem",
        fontSize: "1.5rem",
    }}
    >
    Applications Sent per Day
    </div>

    <VictoryChart
      domainPadding={30}
      theme={VictoryTheme.material} // נותן עיצוב מודרני יותר
      width={300}   // רוחב הגרף
      height={150} 
    >
      {/* ציר X */}
      <VictoryAxis
        tickFormat={(t) => t} // מציג תאריכים
        style={{
          tickLabels: { angle: -45, fontSize: 5, padding: 5, fill: "#333" },
          grid: { stroke: "#e6e6e6" }
        }}
      />

      {/* ציר Y */}
      <VictoryAxis
        dependentAxis
        tickFormat={(t) => t}
        style={{
          tickLabels: { fontSize: 5, fill: "#333" },
          grid: { stroke: "#e6e6e6", strokeDasharray: "4,8" }
        }}
      />

      {/* ברים */}
      <VictoryBar
        data={data}
        x="date"
        y="count"
        labels={({ datum }) => datum.count}
        style={{
          data: {
            fill: "#667eea", // צבע כתום
            width: 5,        // רוחב הבר
            borderRadius: 5,  // פינות מעוגלות
          }
        }}
      />
    </VictoryChart>
    </div>
  );
}
