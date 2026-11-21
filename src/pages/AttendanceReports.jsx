
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  TrendingUp,
  AlertCircle
} from "lucide-react";

import { getCurrentSession } from "../auth/auth";

import {
  getStudents,
  getAttendance
} from "../utils/storage";

import { getAssignmentsForFaculty } from "../utils/facultyUtils";

import "../styles/AttendanceReports.css";

function AttendanceReports() {
  const navigate = useNavigate();
  const session = getCurrentSession();

  const assignments = session
    ? getAssignmentsForFaculty(session.id)
    : [];

  const assignedClasses = [
    ...new Set(
      assignments.map((assignment) =>
        assignment.className === "CSE-A"
          ? "CSE-A"
          : `${assignment.className}-${assignment.section}`
      )
    )
  ];

  const [students] = useState(() => getStudents() || []);
  const [attendanceData] = useState(() => getAttendance() || {});

  const [selectedClass, setSelectedClass] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  if (!session || session.role !== "faculty") {
    return <Navigate to="/" replace />;
  }

  const hasAccess = (student) => {
    return assignments.some((assignment) => {
      if (assignment.className === "CSE-A") {
        return (
          student.class === "CSE-A" ||
          student.className === "CSE-A"
        );
      }

      return (
        student.className ===
          `${assignment.className}-${assignment.section}` ||
        (
          student.class === assignment.className &&
          student.section === assignment.section
        )
      );
    });
  };

  const belongsToSelectedClass = (student) => {
    if (selectedClass === "ALL") {
      return true;
    }

    if (selectedClass === "CSE-A") {
      return (
        student.class === "CSE-A" ||
        student.className === "CSE-A"
      );
    }

    return (
      student.className === selectedClass ||
      `${student.class}-${student.section}` === selectedClass
    );
  };

  const assignedStudents = students.filter(hasAccess);

  const classStudents = assignedStudents.filter(
    belongsToSelectedClass
  );

  const getClassLabel = (student) => {
    if (student.className) return student.className;

    if (student.class && student.section) {
      return `${student.class}-${student.section}`;
    }

    return student.class || "—";
  };

  const getStudentRecords = (studentId) => {
    const records = attendanceData?.[studentId];

    if (!Array.isArray(records)) {
      return [];
    }

    return records.filter((record) => {
      if (!record || !record.date) return false;

      if (record.status !== "Present" && record.status !== "Absent") {
        return false;
      }

      if (startDate && record.date < startDate) {
        return false;
      }

      if (endDate && record.date > endDate) {
        return false;
      }

      return true;
    });
  };

  const reportData = classStudents.map((student) => {
    const records = getStudentRecords(student.id);

    const present = records.filter(
      (record) => record.status === "Present"
    ).length;

    const absent = records.filter(
      (record) => record.status === "Absent"
    ).length;

    const total = present + absent;

    const percentage =
      total > 0
        ? Math.round((present / total) * 100)
        : 0;

    return {
      id: student.id,
      name: student.name || "Unknown Student",
      className: getClassLabel(student),
      present,
      absent,
      total,
      percentage
    };
  });

  const filteredReports = reportData.filter((student) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      student.name.toLowerCase().includes(search) ||
      student.id.toLowerCase().includes(search)
    );
  });

  const totalStudents = classStudents.length;

  const totalPresent = reportData.reduce(
    (sum, student) => sum + student.present,
    0
  );

  const totalAbsent = reportData.reduce(
    (sum, student) => sum + student.absent,
    0
  );

  const totalMarked = totalPresent + totalAbsent;

  const overallPercentage =
    totalMarked > 0
      ? Math.round((totalPresent / totalMarked) * 100)
      : 0;

  const studentsWithRecords = reportData.filter(
    (student) => student.total > 0
  ).length;

  const studentsWithoutRecords =
    totalStudents - studentsWithRecords;

  const formatDate = (date) => {
    if (!date) return "All dates";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getPeriodLabel = () => {
    if (!startDate && !endDate) {
      return "All recorded dates";
    }

    if (startDate && endDate) {
      return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    }

    if (startDate) {
      return `From ${formatDate(startDate)}`;
    }

    return `Until ${formatDate(endDate)}`;
  };

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const exportCSV = () => {
    if (filteredReports.length === 0) {
      setMessage("There are no report records to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Student Name",
      "Class",
      "Present",
      "Absent",
      "Total Marked Days",
      "Attendance Percentage"
    ];

    const rows = filteredReports.map((student) => [
      student.id,
      student.name,
      student.className,
      student.present,
      student.absent,
      student.total,
      `${student.percentage}%`
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const classFileName =
      selectedClass === "ALL"
        ? "all-assigned-classes"
        : selectedClass.replace(/[^a-zA-Z0-9-]/g, "-");

    link.href = url;
    link.download = `attendance-report-${classFileName}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setMessage("Attendance report exported successfully.");
  };

  const clearFilters = () => {
    setSelectedClass("ALL");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setMessage("");
  };

  const getPercentageClass = (percentage, total) => {
    if (total === 0) return "no-records";
    if (percentage >= 75) return "good";
    if (percentage >= 50) return "average";
    return "low";
  };

  return (
    <div className="attendance-reports-page">

      {/* Header */}
      <header className="reports-page-header">

        <div className="reports-heading-content">

          <button
            type="button"
            className="reports-back-button"
            onClick={() => navigate("/faculty")}
          >
            <LayoutDashboard size={17} />
            Back to Dashboard
          </button>

          <h1>Attendance Reports</h1>

          <p>
            View attendance performance and reports for your assigned students.
          </p>

        </div>

        <button
          type="button"
          className="reports-export-button"
          onClick={exportCSV}
        >
          <Download size={18} />
          Export CSV
        </button>

      </header>

      {/* Filters */}
      <section className="reports-filter-panel">

        <div className="reports-filter-heading">
          <div>
            <h2>
              <CalendarDays size={18} />
              Report Filters
            </h2>

            <p>Choose a class and attendance date range.</p>
          </div>

          <button
            type="button"
            className="reports-clear-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="reports-filter-grid">

          <div className="reports-filter-field">
            <label htmlFor="report-class">
              <Users size={15} />
              Class and Section
            </label>

            <select
              id="report-class"
              value={selectedClass}
              onChange={(event) => {
                setSelectedClass(event.target.value);
                setMessage("");
              }}
            >
              <option value="ALL">All Assigned Classes</option>

              {assignedClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          <div className="reports-filter-field">
            <label htmlFor="report-start-date">
              <CalendarDays size={15} />
              From Date
            </label>

            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setStartDate(event.target.value);
                setMessage("");
              }}
            />
          </div>

          <div className="reports-filter-field">
            <label htmlFor="report-end-date">
              <CalendarDays size={15} />
              To Date
            </label>

            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setMessage("");
              }}
            />
          </div>

        </div>

        <div className="reports-period-display">
          <CalendarDays size={15} />
          Report period: <strong>{getPeriodLabel()}</strong>
        </div>

      </section>

      {/* Summary Cards */}
      <section className="reports-summary-grid">

        <div className="reports-summary-card total">
          <div className="reports-summary-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Assigned Students</span>
            <strong>{totalStudents}</strong>
          </div>
        </div>

        <div className="reports-summary-card present">
          <div className="reports-summary-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Present Records</span>
            <strong>{totalPresent}</strong>
          </div>
        </div>

        <div className="reports-summary-card absent">
          <div className="reports-summary-icon">
            <XCircle size={22} />
          </div>

          <div>
            <span>Absent Records</span>
            <strong>{totalAbsent}</strong>
          </div>
        </div>

        <div className="reports-summary-card percentage">
          <div className="reports-summary-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Overall Attendance</span>
            <strong>{overallPercentage}%</strong>
          </div>
        </div>

      </section>

      {/* Report Overview */}
      <section className="reports-overview-panel">

        <div className="reports-overview-heading">
          <div>
            <h2>Attendance Overview</h2>
            <p>
              Summary for {selectedClass === "ALL"
                ? "all your assigned classes"
                : selectedClass}
            </p>
          </div>

          <div className="reports-overview-period">
            {getPeriodLabel()}
          </div>
        </div>

        <div className="reports-overview-content">

          <div className="reports-overview-chart">
            <div
              className="reports-donut"
              style={{
                "--attendance-progress": `${overallPercentage}%`
              }}
            >
              <div className="reports-donut-inner">
                <strong>{overallPercentage}%</strong>
                <span>Present</span>
              </div>
            </div>
          </div>

          <div className="reports-overview-legend">

            <div className="reports-legend-item">
              <span className="reports-legend-dot present-dot" />
              <div>
                <strong>{totalPresent}</strong>
                <span>Present records</span>
              </div>
            </div>

            <div className="reports-legend-item">
              <span className="reports-legend-dot absent-dot" />
              <div>
                <strong>{totalAbsent}</strong>
                <span>Absent records</span>
              </div>
            </div>

            <div className="reports-legend-item">
              <span className="reports-legend-dot unmarked-dot" />
              <div>
                <strong>{studentsWithoutRecords}</strong>
                <span>Students without records</span>
              </div>
            </div>

          </div>

          <div className="reports-overview-note">
            <BookOpen size={19} />

            <div>
              <strong>{totalMarked} attendance entries</strong>
              <p>
                Attendance percentage is calculated using recorded
                Present and Absent entries only.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* Student Report Table */}
      <section className="reports-table-panel">

        <div className="reports-table-header">

          <div>
            <h2>
              <FileText size={19} />
              Student-wise Attendance
            </h2>

            <p>
              Attendance details for each assigned student.
            </p>
          </div>

          <div className="reports-search-box">
            <Search size={18} />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student name or ID"
            />
          </div>

        </div>

        {message && (
          <div className="reports-message" role="status">
            <AlertCircle size={17} />
            {message}
          </div>
        )}

        <div className="reports-table-wrapper">

          <table className="reports-student-table">

            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total Marked</th>
                <th>Attendance %</th>
              </tr>
            </thead>

            <tbody>

              {filteredReports.length === 0 ? (

                <tr>
                  <td colSpan="7" className="reports-empty-row">
                    {classStudents.length === 0
                      ? "No students are assigned to this class."
                      : "No students match your search."}
                  </td>
                </tr>

              ) : (

                filteredReports.map((student) => (
                  <tr key={student.id}>

                    <td className="reports-student-id">
                      {student.id}
                    </td>

                    <td>
                      <div className="reports-student-name">
                        <div className="reports-student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>

                        <strong>{student.name}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="reports-class-badge">
                        {student.className}
                      </span>
                    </td>

                    <td>
                      <span className="reports-present-count">
                        {student.present}
                      </span>
                    </td>

                    <td>
                      <span className="reports-absent-count">
                        {student.absent}
                      </span>
                    </td>

                    <td>{student.total}</td>

                    <td>
                      <span
                        className={`reports-percentage-badge ${
                          getPercentageClass(
                            student.percentage,
                            student.total
                          )
                        }`}
                      >
                        {student.total > 0
                          ? `${student.percentage}%`
                          : "No records"}
                      </span>
                    </td>

                  </tr>
                ))

              )}

            </tbody>

          </table>

        </div>

        <div className="reports-table-footer">
          <span>
            Showing {filteredReports.length} of {classStudents.length} students
          </span>

          <span>
            {studentsWithRecords} students have attendance records
          </span>
        </div>

      </section>

    </div>
  );
}

export default AttendanceReports;
