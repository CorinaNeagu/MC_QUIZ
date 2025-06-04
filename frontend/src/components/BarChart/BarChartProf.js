import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const SVGBarChart = ({ data, width = 800, height = 400, barColor = "#4B9CD3" }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return <div>No performance data available for this quiz.</div>;
  }

  const maxBarsToShow = 20;
  const chartData = data.slice(0, maxBarsToShow);

  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxScore = 100;

  const totalBars = chartData.length;
  const barSpacing = 10;
  const barWidth = (chartWidth - barSpacing * (totalBars - 1)) / totalBars;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
    >
      {/* Y-axis grid lines and labels */}
      {[0, 20, 40, 60, 80, 100].map((tick) => {
        const y = height - padding - (tick / maxScore) * chartHeight;
        return (
          <g key={tick}>
            <line
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#ddd"
              strokeDasharray="4 2"
            />
            <text
              x={padding - 10}
              y={y + 5}
              fontSize="12"
              textAnchor="end"
              fill="#666"
            >
              {tick}%
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {chartData.map((item, index) => {
        const barHeight = (item.score / maxScore) * chartHeight;
        const x = padding + index * (barWidth + barSpacing);
        const y = height - padding - barHeight;
        return (
          <g
            key={item.name}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={barColor}
              rx={2}
            />
            {/* Bar labels */}
            <text
              x={x + barWidth / 2}
              y={height - padding + 15}
              fontSize="9"
              textAnchor="middle"
              fill="#333"
              transform={`rotate(-45, ${x + barWidth / 2}, ${height - padding + 15})`}
            >
              {item.name.length > 8 ? item.name.slice(0, 8) + "…" : item.name}
            </text>
            {/* Score on top of bars */}
            <text
              x={x + barWidth / 2}
              y={y - 5}
              fontSize="10"
              textAnchor="middle"
              fill="#000"
            >
              {item.score}%
            </text>

            {/* Tooltip */}
            {hoveredIndex === index && (
              <text
                x={x + barWidth / 2}
                y={y - 20}
                fontSize="12"
                fontWeight="bold"
                fill="#000"
                textAnchor="middle"
                pointerEvents="none"
                style={{ userSelect: "none" }}
              >
                {item.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#000"
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#000"
      />
    </svg>
  );
};



const BarChartProf = () => {
  const [quizList, setQuizList] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        navigate("/login");
      } else {
        setUserType(decoded.userType);
        fetchProfessorQuizzes(token);
      }
    } catch (err) {
      console.error("Invalid token:", err);
      navigate("/login");
    }
  }, [navigate]);

  const fetchProfessorQuizzes = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/user/professor/quizzes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizList(res.data);
    } catch (err) {
      console.error("Error fetching professor's quizzes:", err);
    }
  };

  const fetchQuizPerformance = async (quizId) => {
    const token = localStorage.getItem("token");
    if (!token || !quizId) return;

    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/stats/professor/quiz-scores/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized = res.data.map((item) => ({
        name: item.student_name,
        score: parseFloat(item.score_percentage),
      }));

      setPerformanceData(normalized);
    } catch (err) {
      console.error("Error fetching quiz performance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChange = (e) => {
    const quizId = e.target.value;
    setSelectedQuizId(quizId);
    fetchQuizPerformance(quizId);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem" }}>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="quiz-select" className="block mb-2 font-medium">
          Select a quiz:
        </label>
        <select
          id="quiz-select"
          className="border px-3 py-2 rounded w-full"
          value={selectedQuizId || ""}
          onChange={handleQuizChange}
        >
          <option value="" disabled>
            Choose a quiz
          </option>
          {quizList.map((quiz) => (
            <option key={quiz.quiz_id} value={quiz.quiz_id}>
              {quiz.title} ({quiz.category_name}
              {quiz.subcategory_name ? ` > ${quiz.subcategory_name}` : ""})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading chart...</div>
      ) : (
        <SVGBarChart data={performanceData} />
      )}
    </div>
  );
};

export default BarChartProf;
