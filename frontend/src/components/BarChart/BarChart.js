import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const BarChart = ({ selectedCategory, selectedSubcategory }) => {
  const [quizData, setQuizData] = useState([]);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000;

      if (expirationTime < Date.now()) {
        navigate("/");
      } else {
        setUserType(decodedToken.userType);
      }
    } catch (err) {
      console.error("Invalid or expired token:", err);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        if (userType === "student" && selectedCategory) {
          const response = await axios.get(
            `http://localhost:5000/api/stats/student-category-quizzes/${selectedCategory}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setQuizData(response.data);
        } else if (userType === "professor") {
          const response = await axios.get(
            "http://localhost:5000/api/stats/professor-grade-distribution",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const normalized = response.data.map((item) => ({
            quiz_title: item.quiz_title || item.name,
            real_score: item.real_score || item.value,
            subcategory_name: item.subcategory_name || "General",
          }));
          setQuizData(normalized);
        }
      } catch (err) {
        console.error("Error fetching quiz data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userType, selectedCategory]);

  const renderGroupedBarChart = (data) => {
    const chartHeight = 300;
    const topPadding = 30;
    const svgPadding = 60;
    const barWidth = 30;

    const subcategoryNames = [...new Set(data.map((quiz) => quiz.subcategory_name))];
    const chartWidth = 800;

    const dynamicSpacing = 10;
    const subcategorySpacing = subcategoryNames.length === 1 ? 0 : 100;

    const maxValue = Math.max(...data.map((quiz) => parseFloat(quiz.real_score)), 100);

    return (
      <svg width={chartWidth} height={chartHeight + topPadding + 80} style={{ position: "relative" }}>
        {/* Y-axis ticks */}
        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const y = topPadding + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={tick}>
              <line x1="40" y1={y} x2="1500" y2={y} stroke="#ccc" />
              <text x="35" y={y - 5} textAnchor="end" fontSize="12">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars and labels */}
        {subcategoryNames.map((subcategory, subcategoryIndex) => {
          const quizzesInSub = data.filter((quiz) => quiz.subcategory_name === subcategory);

          return (
            <g key={subcategory}>
              {quizzesInSub.map((quiz, quizIndex) => {
                const barHeight = (parseFloat(quiz.real_score) / maxValue) * chartHeight;
                const x =
                  svgPadding +
                  subcategoryIndex * (subcategorySpacing + quizzesInSub.length * (barWidth + dynamicSpacing)) +
                  (quizIndex + 1) * dynamicSpacing +
                  quizIndex * barWidth;
                const y = topPadding + chartHeight - barHeight;

                return (
                  <g key={quiz.quiz_id || quiz.quiz_title}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#4B9CD3"
                      onMouseEnter={(e) =>
                        setTooltip({
                          visible: true,
                          x: e.clientX,
                          y: e.clientY,
                          content: quiz.quiz_title,
                        })
                      }
                      onMouseMove={(e) =>
                        setTooltip((prev) => ({
                          ...prev,
                          x: e.clientX,
                          y: e.clientY,
                        }))
                      }
                      onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: "" })}
                    />
                    <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="12">
                      {quiz.real_score}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={topPadding + chartHeight + 15}
                      textAnchor="middle"
                      fontSize="12"
                    >
                      {quiz.quiz_title.length > 5 ? quiz.quiz_title.slice(0, 5) + "…" : quiz.quiz_title}
                    </text>
                  </g>
                );
              })}

              <text
                x={
                  svgPadding +
                  subcategoryIndex * (subcategorySpacing + quizzesInSub.length * (barWidth + dynamicSpacing)) +
                  (quizzesInSub.length * (barWidth + dynamicSpacing)) / 2
                }
                y={topPadding + chartHeight + 35}
                textAnchor="middle"
                fontSize="14"
              >
                {subcategory.length > 15 ? subcategory.slice(0, 15) + "…" : subcategory}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading) return <div>Loading chart...</div>;

  const filteredData = selectedSubcategory
    ? quizData.filter((quiz) => quiz.subcategory_name === selectedSubcategory)
    : quizData;

  return (
    <div className="bar-chart-wrapper" style={{ overflowX: "auto", width: "100%" }}>
      <div style={{ minWidth: "1000px", overflow: "visible" }}>
        {filteredData.length > 0 ? (
          <>
            <h3>
              {userType === "student"
                ? `Quiz Scores for Category: ${selectedCategory}`
                : "Average Grades for Your Quizzes"}
            </h3>
            {renderGroupedBarChart(filteredData)}
          </>
        ) : (
          <div>No data found.</div>
        )}
      </div>
    </div>
  );
};

export default BarChart;
