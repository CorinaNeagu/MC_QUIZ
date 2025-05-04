import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

const LineChart = ({ quizId }) => {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);

  const parseTime = (timeString) => {
    // If the timeString is a full date (e.g., 2025-04-27T10:47:55.000Z)
    if (timeString.includes("T")) {
      return d3.isoParse(timeString);  // ISO 8601 format
    }

    // If the timeString only contains time (e.g., :20 or :25), assume today and append the time to current date
    const now = new Date();
    const datePart = now.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const fullDateString = `${datePart}T${timeString}`;  // Combine the date part with the time

    return d3.isoParse(fullDateString);  // Parse the full date-time
};



  // Fetch quiz scores when quizId changes
  useEffect(() => {
    if (!quizId) return; // Early return if quizId is not provided

    const fetchQuizScores = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/stats/quizzes-taken-by-user/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Fetched quiz scores:', response.data); // Log the response

        // Check if response contains the data in expected format
        if (Array.isArray(response.data) && response.data.length > 0) {
          // Log to verify the quiz_id
          console.log('Filtering quizzes with quiz_id:', quizId);
          
          // Ensure quiz_id from response and quizId are compared correctly (convert both to strings)
          const transformedScores = response.data
            .filter(quiz => String(quiz.quiz_id) === String(quizId)) // Convert both to strings to avoid type mismatch
            .map(quiz => ({
              ...quiz,
              score: parseFloat(quiz.score), // Ensure the score is a number
              date: new Date(quiz.start_time),  // Convert start_time to Date
            }));

          // Log transformed scores to verify the structure
          console.log('Transformed scores:', transformedScores);

          // Set the transformed scores to state
          setScores(transformedScores);
        } else {
          setError('No data or incorrect response format');
        }
      } catch (err) {
        setError('Error fetching quiz scores');
        console.error(err);
      }
    };

    fetchQuizScores();
  }, [quizId]); // Re-run this effect if quizId changes

  // D3 chart rendering
  useEffect(() => {
    if (scores.length === 0) return;  // Don't render if there are no scores
  
    d3.select(`#line-chart-${quizId}`).selectAll("*").remove();
  
    const margin = { top: 20, right: 30, bottom: 80, left: 40 };
    const width = 450 - margin.left - margin.right; // Smaller width for the chart
    const height = 400 - margin.top - margin.bottom; // Smaller height for the chart

    
  
    const svg = d3.select(`#line-chart-${quizId}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // Map and parse the scores
    const data = scores
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))  // Sort by start_time
      .map(d => ({
        date: parseTime(d.start_time),  // Parse start_time
        score: d.score
      }));
  
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date)) // Use parsed date for x axis
      .range([0, width]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.score)]) // Set y domain based on score
      .range([height, 0]);
  
      svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(
    d3.axisBottom(x)
      .tickValues(data.map(d => d.date)) // Only show ticks for actual data points
      .tickFormat(d => {
        const formatTime = d3.timeFormat("%b %d %H:%M"); // e.g., "Apr 30 12:46"
        return formatTime(d);
      })
  )
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-0.8em")
  .attr("dy", "0.15em")
  .attr("transform", "rotate(-45)");

    
    
  
    svg.append("g")
      .call(d3.axisLeft(y));
  
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.score));
  
    svg.append("path")
      .data([data])
      .attr("class", "line")
      .attr("d", line)
      .style("stroke", "#4B9CD3")
      .style("stroke-width", 2)
      .style("fill", "none");
  
    svg.selectAll("dot")
      .data(data)
      .enter().append("circle")
      .attr("r", 3)
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.score))
      .style("fill", "#4B9CD3");
  
  }, [scores, quizId]);
  
  

  return (
    <div className="line-chart-container">
      {error && <p>{error}</p>}
      <svg id={`line-chart-${quizId}`} width="100%" height="400"></svg>
    </div>
  );
};

export default LineChart;
