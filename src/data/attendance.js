
// src/data/attendance.js

import { students } from "./students";

// Format a date as YYYY-MM-DD using local time.
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Generate the last 30 working days.
const generateWorkingDays = () => {
  const dates = [];
  const currentDate = new Date();

  while (dates.length < 30) {
    const day = currentDate.getDay();

    // Monday to Friday only.
    if (day !== 0 && day !== 6) {
      dates.unshift(formatDate(currentDate));
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return dates;
};

export const workingDays = generateWorkingDays();

// Generate attendance for every student.
export const attendance = students.reduce((result, student, index) => {
  result[student.id] = workingDays.map((date, dayIndex) => {
    // Deterministic sample attendance.
    const value = (index * 7 + dayIndex * 3) % 10;

    return {
      date,
      status: value < 8 ? "Present" : "Absent"
    };
  });

  return result;
});

export default attendance;
