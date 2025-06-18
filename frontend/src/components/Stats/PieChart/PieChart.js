import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ModalPieChart from "../ModalPieChart/ModalPieChart";
import "./PieChart.css";

const COLORS = ["#4169E1", "#00CED1", "#191970", "#4B9CD3", "#ADD8E6"];

const PieChartComponent = () => {
  const [quizStats, setQuizStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizzesInCategory, setQuizzesInCategory] = useState([]);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Fetch quiz categories on mount
  useEffect(() => {
    const fetchQuizCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You must be logged in to see quiz statistics.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/stats/pie-chart/quiz-category",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (Array.isArray(response.data)) {
          setQuizStats(response.data);
        } else {
          setError("No data available.");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching quiz category statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizCategories();
  }, []);

  // Memoize transformed data for PieChart
  const pieChartData = useMemo(() => {
    return quizStats.map(({ category_name, quizzes_taken, category_id }) => ({
      name: category_name,
      value: quizzes_taken,
      category_id,
    }));
  }, [quizStats]);

  // Handle clicking a pie slice to open modal with quizzes in category
  const handlePieClick = async (data, index, event) => {
    if (!data?.payload?.category_id) {
      console.error("category_id missing from pie slice data");
      return;
    }

    const { category_id, name } = data.payload;
    setSelectedCategory(name);
    setModalPosition({ x: event.clientX, y: event.clientY });
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setModalError("You must be logged in to see quizzes for this category.");
        setModalLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/stats/quizzes-by-category/${category_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuizzesInCategory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setModalError("Error fetching quizzes for the selected category.");
      setQuizzesInCategory([]);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div>Loading chart data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (pieChartData.length === 0) return <div>No data available for the pie chart.</div>;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={pieChartData}
            dataKey="value"
            nameKey="name"
            outerRadius={120}
            fill="#8884d8"
            isAnimationActive={true}
            animationDuration={1000}
            onClick={handlePieClick}
          >
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ marginBottom: 20 }} />
        </PieChart>
      </ResponsiveContainer>

      {isModalOpen && (
        <ModalPieChart
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          position={modalPosition}
          selectedCategory={selectedCategory}
          quizzesInCategory={quizzesInCategory}
          loading={modalLoading}
          error={modalError}
        />
      )}
    </div>
  );
};

export default PieChartComponent;
