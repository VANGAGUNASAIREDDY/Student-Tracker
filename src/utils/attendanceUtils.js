
// src/utils/attendanceUtils.js

// Get attendance statistics for one student.
export const calculateAttendance = (records = []) => {
  const totalClasses = records.length;

  const presentDays = records.filter(
    (record) => record.status === "Present"
  ).length;

  const absentDays = records.filter(
    (record) => record.status === "Absent"
  ).length;

  const percentage =
    totalClasses === 0
      ? 0
      : (presentDays / totalClasses) * 100;

  return {
    totalClasses,
    presentDays,
    absentDays,
    percentage: Number(percentage.toFixed(2))
  };
};

// Get attendance statistics for all students.
export const calculateClassAttendance = (students, attendance) => {
  const totalStudents = students.length;

  let totalPercentage = 0;
  let lowAttendanceCount = 0;
  let totalClasses = 0;

  students.forEach((student) => {
    const records = attendance[student.id] || [];

    const stats = calculateAttendance(records);

    totalPercentage += stats.percentage;
    totalClasses = Math.max(totalClasses, stats.totalClasses);

    if (stats.percentage < 75) {
      lowAttendanceCount++;
    }
  });

  const averageAttendance =
    totalStudents === 0
      ? 0
      : totalPercentage / totalStudents;

  return {
    totalStudents,
    totalClasses,
    averageAttendance: Number(averageAttendance.toFixed(2)),
    lowAttendanceCount
  };
};

// Get attendance percentage label.
export const getAttendanceStatus = (percentage) => {
  if (percentage >= 90) return "Excellent";
  if (percentage >= 80) return "Good";
  if (percentage >= 75) return "Average";

  return "Low";
};

// Update attendance for a particular date.
export const updateAttendanceRecord = (
  attendance,
  studentId,
  date,
  status
) => {
  const studentRecords = attendance[studentId] || [];

  const existingRecord = studentRecords.find(
    (record) => record.date === date
  );

  if (existingRecord) {
    return {
      ...attendance,
      [studentId]: studentRecords.map((record) =>
        record.date === date
          ? { ...record, status }
          : record
      )
    };
  }

  return {
    ...attendance,
    [studentId]: [
      ...studentRecords,
      { date, status }
    ].sort((a, b) => a.date.localeCompare(b.date))
  };
};
