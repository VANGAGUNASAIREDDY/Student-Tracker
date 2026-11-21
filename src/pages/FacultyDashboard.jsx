
import { Navigate, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BookOpen,
  LogOut,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ClipboardList
} from "lucide-react";

import { getCurrentSession, logout } from "../auth/auth";
import { getStudents, getAttendance } from "../utils/storage";
import { getAssignmentsForFaculty } from "../utils/facultyUtils";

import "../styles/FacultyDashboard.css";

const matchesAssignment = (student, assignment) => {
  if (!student || !assignment) return false;

  // Support older CSE-A assignments.
  if (!assignment.classNumber && assignment.className) {
    const studentClass = student.className || student.class || "";

    return (
      studentClass === assignment.className ||
      `${student.class || ""}-${student.section || ""}` ===
        assignment.className
    );
  }

  return (
    (student.className || student.class) ===
      `Class ${assignment.classNumber}` &&
    String(student.section || "").toUpperCase() ===
      String(assignment.section || "").toUpperCase()
  );
};

export default function FacultyDashboard() {
  const navigate = useNavigate();

  const session = getCurrentSession();

  const facultyId = session?.id;

  // Get faculty assignments.
  const assignments = facultyId
    ? getAssignmentsForFaculty(facultyId) || []
    : [];

  // Get existing students and attendance without modifying storage.
  const allStudents = getStudents() || [];
  const attendanceData = getAttendance() || {};

  // Find students belonging to this faculty's assignments.
  const studentMap = new Map();

  assignments.forEach((assignment) => {
    allStudents
      .filter((student) =>
        matchesAssignment(student, assignment)
      )
      .forEach((student) => {
        studentMap.set(student.id, student);
      });
  });

  const assignedStudents = Array.from(studentMap.values());

  // Show only attendance marked by this faculty for
  // their assigned subject and class.
  const facultyAttendance = assignedStudents.flatMap((student) => {
    const records = attendanceData[student.id] || [];

    return records
      .filter((record) =>
        record.markedBy === facultyId &&
        assignments.some(
          (assignment) =>
            assignment.subject === record.subject &&
            matchesAssignment(student, assignment)
        )
      )
      .map((record) => ({
        ...record,
        studentId: student.id,
        studentName: student.name,
        studentClass: student.className || student.class,
        studentSection: student.section || ""
      }));
  });

  const subjects = [
    ...new Set(
      assignments
        .map((assignment) => assignment.subject)
        .filter(Boolean)
    )
  ];

  const presentCount = facultyAttendance.filter(
    (record) => record.status === "Present"
  ).length;

  const absentCount = facultyAttendance.filter(
    (record) => record.status === "Absent"
  ).length;

  const totalMarked = presentCount + absentCount;

  const attendancePercentage =
    totalMarked > 0
      ? Math.round((presentCount / totalMarked) * 100)
      : 0;

  const latestAttendance = [...facultyAttendance]
    .sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    )
    .slice(0, 10);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!session || session.role !== "faculty") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="faculty-dashboard">
      <aside className="faculty-sidebar">
        <div className="faculty-brand">
          <GraduationCap size={30} />
          <div>
            <h2>Student Tracker</h2>
            <span>Faculty Portal</span>
          </div>
        </div>

        <nav className="faculty-navigation">
          <button
            className="faculty-nav-item active"
            onClick={() => navigate("/faculty")}
          >
            <BookOpen size={19} />
            Dashboard
          </button>

          <button
            className="faculty-nav-item"
            onClick={() => navigate("/faculty/attendance")}
          >
            <CalendarCheck size={19} />
            Attendance
          </button>

          <button
            className="faculty-nav-item"
            onClick={() => navigate("/faculty/reports")}
          >
            <ClipboardList size={19} />
            Reports
          </button>
        </nav>

        <button
          className="faculty-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main className="faculty-main">
        <header className="faculty-header">
          <div>
            <h1>Faculty Dashboard</h1>
            <p>Welcome, {session.name || "Faculty"}</p>
          </div>

          <div className="faculty-profile">
            <span className="faculty-avatar">
              {(session.name || "F").charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{session.name}</strong>
              <small>{facultyId}</small>
            </div>
          </div>
        </header>

        <section className="faculty-welcome">
          <div>
            <h2>Welcome back!</h2>
            <p>
              Manage attendance and view records for your
              assigned subjects and classes.
            </p>
          </div>
          <GraduationCap size={55} />
        </section>

        <section className="faculty-subject-section">
          <h2>My Assigned Subjects</h2>

          {subjects.length === 0 ? (
            <p>No subjects have been assigned.</p>
          ) : (
            <div className="faculty-subject-list">
              {subjects.map((subject) => {
                const subjectAssignments = assignments.filter(
                  (item) => item.subject === subject
                );

                return (
                  <div
                    className="faculty-subject-card"
                    key={subject}
                  >
                    <BookOpen size={22} />
                    <h3>{subject}</h3>
                    <p>
                      {subjectAssignments.length} assigned
                      class-section combinations
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="faculty-stats">
          <div className="faculty-stat-card">
            <div className="faculty-stat-icon blue">
              <Users size={23} />
            </div>
            <div>
              <span>Assigned Students</span>
              <h2>{assignedStudents.length}</h2>
            </div>
          </div>

          <div className="faculty-stat-card">
            <div className="faculty-stat-icon green">
              <CheckCircle2 size={23} />
            </div>
            <div>
              <span>Present Records</span>
              <h2>{presentCount}</h2>
            </div>
          </div>

          <div className="faculty-stat-card">
            <div className="faculty-stat-icon red">
              <XCircle size={23} />
            </div>
            <div>
              <span>Absent Records</span>
              <h2>{absentCount}</h2>
            </div>
          </div>

          <div className="faculty-stat-card">
            <div className="faculty-stat-icon purple">
              <TrendingUp size={23} />
            </div>
            <div>
              <span>Attendance Percentage</span>
              <h2>{attendancePercentage}%</h2>
            </div>
          </div>
        </section>

        <section className="faculty-assignment-section">
          <div className="faculty-section-heading">
            <h2>My Assigned Classes</h2>
            <span>{assignments.length} assignments</span>
          </div>

          {assignments.length === 0 ? (
            <p>No classes assigned yet.</p>
          ) : (
            <div className="faculty-table-wrapper">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Students</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((assignment) => {
                    const count = allStudents.filter(
                      (student) =>
                        matchesAssignment(student, assignment)
                    ).length;

                    return (
                      <tr key={assignment.id}>
                        <td>{assignment.className}</td>
                        <td>{assignment.section || "-"}</td>
                        <td>{assignment.subject}</td>
                        <td>{count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="faculty-recent-section">
          <div className="faculty-section-heading">
            <h2>My Recent Attendance</h2>

            <button
              onClick={() => navigate("/faculty/attendance")}
            >
              Mark Attendance
            </button>
          </div>

          {latestAttendance.length === 0 ? (
            <div className="faculty-empty-state">
              <CalendarCheck size={35} />
              <h3>No faculty attendance records found</h3>
              <p>
                Attendance marked by you for your assigned
                subjects will appear here.
              </p>
            </div>
          ) : (
            <div className="faculty-table-wrapper">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {latestAttendance.map((record, index) => (
                    <tr
                      key={`${record.studentId}-${record.date}-${index}`}
                    >
                      <td>{record.studentName}</td>
                      <td>
                        {record.studentClass}
                        {record.studentSection
                          ? `-${record.studentSection}`
                          : ""}
                      </td>
                      <td>{record.subject}</td>
                      <td>{record.date}</td>
                      <td>
                        <span
                          className={
                            record.status === "Present"
                              ? "attendance-status present"
                              : "attendance-status absent"
                          }
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
