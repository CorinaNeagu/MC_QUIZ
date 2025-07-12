// src/components/Stats/RadarChart/SubcategoryRadar.js
import React, { useEffect, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const SimpleRadar = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          "http://localhost:5000/api/stats/subcategory-averages",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(data);
      } catch (err) {
        console.error("Failed to fetch subcategory averages:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading radar chart…</p>;
  if (!data.length) return <p>No quiz data yet.</p>;

  return (
    <div className="radar-chart-container">
      <h2 className="header">Subcategory Performance Overview</h2>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart outerRadius={150} data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subcategory_name" />
          <PolarRadiusAxis domain={[0, 100]} angle={30} />
          <Radar
            name="Average %"
            dataKey="avg_percentage"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleRadar;
