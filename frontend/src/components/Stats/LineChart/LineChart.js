import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const RetakeLineChart = ({ studentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!studentId) {
    console.warn("studentId not defined!");
    return;
  }

  const fetchRetakeData = async () => {
  try {
    const token = localStorage.getItem('token');  
    if (!token) {
      console.warn("No token found, cannot fetch retake data.");
      setLoading(false);
      return;
    }
    
    const res = await axios.get(
      `http://localhost:5000/api/stats/retake-scores-history/${studentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Retake data response:", res.data);  // <-- add this log

    if (!Array.isArray(res.data)) {
      console.error("Expected an array from API but got:", res.data);
      setData([]);
      setLoading(false);
      return;
    }

    const chartData = [];
    res.data.forEach((quiz) => {
      quiz.scores.forEach((attempt, index) => {
        if (!chartData[index]) chartData[index] = { attempt: index + 1 };
        chartData[index][quiz.title] = attempt.percentage_score;
      });
    });

    setData(chartData);
  } catch (error) {
    console.error("Error fetching retake quiz data", error);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  fetchRetakeData();  // <---- CALL IT HERE

}, [studentId]);




   

  if (loading) return <div>Loading retake data...</div>;
  if (data.length === 0) return <div>No retake attempts found.</div>;

  
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, bottom: 30, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="attempt"
          label={{
            value: "Attempt Number",
            position: "insideBottomRight",
            offset: -10,
          }}
        />
        <YAxis
          domain={[0, 100]}
          label={{
            value: "Percentage Score",
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip />
        <Legend verticalAlign="top" height={36} />
        {Object.keys(data[0])
          .filter((key) => key !== "attempt")
          .map((quizTitle, idx) => (
            <Line
              key={quizTitle}
              type="monotone"
              dataKey={quizTitle}
              stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RetakeLineChart;
