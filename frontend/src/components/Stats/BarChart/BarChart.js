import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from "recharts";

const BarChartComponent = ({ selectedCategory, selectedSubcategory, categories = [] }) => {
  const [quizData, setQuizData] = useState([]);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);
  

  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/");
    return;
  }

  try {
    const decodedToken = jwtDecode(token);
    const expirationTime = decodedToken.exp * 1000;

    if (expirationTime < Date.now()) {
      navigate("/");
    } else {
      setUserType(decodedToken.userType);
      setStudentId(decodedToken.id); 
    }
  } catch (err) {
    console.error("Invalid or expired token:", err);
    navigate("/");
  }
}, [navigate]);


  useEffect(() => {
    const fetchData = async () => {
      if (!userType) return; 
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        if (userType === "student" && selectedCategory) {
          const response = await axios.get(
            `http://localhost:5000/api/stats/student-category-quizzes/${selectedCategory}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const normalizedData = response.data.map((item) => ({
            quizTitle: item.quiz_title,
            realScore: item.real_score || 0,
            subcategoryName: item.subcategory_name || "General",
          }));

          const filtered = selectedSubcategory
            ? normalizedData.filter((q) => q.subcategoryName === selectedSubcategory)
            : normalizedData;

          setQuizData(filtered);
        } else if (userType === "professor") {
          const response = await axios.get(
            "http://localhost:5000/api/stats/professor-grade-distribution",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const normalized = response.data.map((item) => ({
            quizTitle: item.quiz_title || item.name,
            realScore: item.real_score || item.value,
            subcategoryName: item.subcategory_name || "General",
          }));

          setQuizData(normalized);
        } else {
          setQuizData([]);
        }
      } catch (err) {
        console.error("Error fetching quiz data:", err);
        setQuizData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userType, selectedCategory, selectedSubcategory]);

  if (loading) return <div>Loading chart...</div>;

  if (!userType) return null;

  if (quizData.length === 0) return <div>No data found.</div>;

  return (
  <div className="bar-chart-wrapper">

    <div className="bar-chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={quizData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="quizTitle"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
            tickFormatter={(str) => (str.length > 10 ? str.slice(0, 10) + "…" : str)}
            className="x-axis"
          />
          <YAxis domain={[0, 120]} className="y-axis" />
          <Tooltip />
          <Legend wrapperStyle={{ transform: 'translateY(20px)',}} />

          <Bar 
            dataKey="realScore" 
            fill="#4a90e2" 
            name="Score"  
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            barSize={40}
         />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

};

export default BarChartComponent;
