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
import "./LineChart.css";

const CustomLegend = ({ payload, visibleQuizzes, toggleQuiz }) => {
  return (
    <div className="legend-container">
      {payload.map((entry) => {
        const isVisible = visibleQuizzes[entry.value];

        return (
          <div
  key={entry.value}
  onClick={() => toggleQuiz(entry.value)}
  title={entry.value}
  className={`legend-pill ${isVisible ? "active" : ""}`}
  style={{
    backgroundColor: isVisible ? entry.color : "#fff",
    borderColor: entry.color,
    color: isVisible ? "#fff" : "#999",
  }}
>
  <div
    className="legend-pill-dot"
    style={{
      backgroundColor: isVisible ? "#fff" : entry.color,
      borderColor: isVisible ? "#fff" : entry.color,
    }}
  />
  <span>{entry.value}</span>
</div>

        );
      })}
    </div>
  );
};

const RetakeLineChart = ({ studentId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleQuizzes, setVisibleQuizzes] = useState({});

  useEffect(() => {
    if (!studentId) {
      console.warn("studentId not defined!");
      return;
    }

    const fetchRetakeData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found, cannot fetch retake data.");
          setLoading(false);
          return;
        }

        const { data: apiData } = await axios.get(
          `http://localhost:5000/api/stats/retake-scores-history/${studentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!Array.isArray(apiData)) {
          console.error("Expected an array from API but got:", apiData);
          setData([]);
          setLoading(false);
          return;
        }

        const chartData = [];
        apiData.forEach((quiz) => {
          quiz.scores.forEach((attempt, index) => {
            if (!chartData[index]) chartData[index] = { attempt: index + 1 };
            chartData[index][quiz.title] = attempt.percentage_score;
          });
        });

        setData(chartData);

        if (chartData.length > 0) {
          const initialVisibility = {};
          Object.keys(chartData[0])
            .filter((key) => key !== "attempt")
            .forEach((quizTitle) => {
              initialVisibility[quizTitle] = true;
            });
          setVisibleQuizzes(initialVisibility);
        }
      } catch (error) {
        console.error("Error fetching retake quiz data", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRetakeData();
  }, [studentId]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading retake chart...</p>;
  if (data.length === 0) return <p style={{ textAlign: "center" }}>No retake attempts found.</p>;

  const quizTitles = Object.keys(data[0]).filter((key) => key !== "attempt");

  const toggleQuiz = (quizTitle) => {
    setVisibleQuizzes((prev) => ({
      ...prev,
      [quizTitle]: !prev[quizTitle],
    }));
  };

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="attempt"
          label={{
            value: "Attempt Number",
            position: "insideBottomRight",
            offset: -10,
            fontSize: 13,
          }}
        />
        <YAxis
          domain={[0, 100]}
          label={{
            value: "Score",
            angle: -90,
            position: "insideLeft",
            fontSize: 13,
          }}
        />
        <Tooltip
          formatter={(value) => `${value.toFixed(1)}%`}
          labelFormatter={(label) => `Attempt ${label}`}
        />
        <Legend
          content={(props) => (
            <CustomLegend
              {...props}
              visibleQuizzes={visibleQuizzes}
              toggleQuiz={toggleQuiz}
            />
          )}
        />

        {quizTitles.map((quizTitle, idx) => (
          <Line
            key={quizTitle}
            type="monotone"
            dataKey={quizTitle}
            stroke={`hsl(${(idx * 47) % 360}, 70%, 50%)`}
            strokeWidth={2}
            activeDot={{ r: 5 }}
            dot={{ r: 3 }}
            strokeOpacity={visibleQuizzes[quizTitle] ? 1 : 0.3}
            opacity={visibleQuizzes[quizTitle] ? 1 : 0.3}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RetakeLineChart;
