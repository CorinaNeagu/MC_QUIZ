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

const stroke = "#2563eb"; // blue‑600
const fill = "#3b82f6"; // blue‑500

const QuizRadar = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  // 1️⃣ Fetch categories on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/categories");
        setCategories(data.categories);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    })();
  }, []);

  // 2️⃣ Fetch subcategories when category changes
  useEffect(() => {
    if (!selectedCat) {
      setSubcategories([]);
      setSelectedSub("");
      return;
    }

    (async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/stats/subcategories/${selectedCat}`
        );
        setSubcategories(data);
      } catch (err) {
        console.error("Failed to load subcategories", err);
        setSubcategories([]);
      }
      setSelectedSub("");
      setChartData([]);
      setError(null);
    })();
  }, [selectedCat]);

  // 3️⃣ Fetch radar data when subcategory changes
  useEffect(() => {
    if (!selectedSub) {
      setChartData([]);
      setError(null);
      return;
    }

    (async () => {
      setLoadingChart(true);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `http://localhost:5000/api/stats/quiz-averages?subcategory_id=${selectedSub}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load quiz averages", err);
        setChartData([]);
        setError("Failed to load quiz averages.");
      } finally {
        setLoadingChart(false);
      }
    })();
  }, [selectedSub]);

  return (
    <div className="p-6 bg-white rounded-xl shadow w-full max-w-5xl mx-auto">
      <h2 className="header mb-4 text-2xl font-semibold">Quiz Radar</h2>

      <div className="flex flex-wrap gap-4 items-center justify-center mb-6">
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>

        <select
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
          disabled={!selectedCat}
          className="border rounded px-3 py-2"
        >
          <option value="">Select Subcategory</option>
          {subcategories.map((sub) => (
            <option key={sub.subcategory_id} value={sub.subcategory_id}>
              {sub.subcategory_name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart Area */}
      {loadingChart && (
        <p className="text-gray-500 text-sm text-center">Loading chart…</p>
      )}
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {!loadingChart && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={chartData} outerRadius={160}>
            <PolarGrid />
            <PolarAngleAxis dataKey="quiz_title" />
            <PolarRadiusAxis domain={[0, 100]} angle={30} />
            <Radar
              name="Avg %"
              dataKey="avg_percentage"
              stroke={stroke}
              fill={fill}
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      )}
      {!loadingChart && !error && selectedSub && chartData.length === 0 && (
        <p className="text-gray-500 text-sm text-center">
          No data for this subcategory.
        </p>
      )}
    </div>
  );
};

export default QuizRadar;
