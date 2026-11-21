
import { useNavigate, Navigate } from "react-router-dom";
import {
  GraduationCap,
  CalendarCheck,
  UserRound,
  LogOut,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  XCircle,
  TrendingUp
} from "lucide-react";

import { getCurrentSession, logout } from "../auth/auth";

import {
  getStudents,
  getStudentAttendance
} from "../utils/storage";

import "../styles/Dashboard.css";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const session = getCurrentSession();

  // Find the currently logged-in student.
  const students = getStudents();

  const student = students.find(
    (item) => item.id === session?.id
  );

  // Get all attendance records for this student.
  // Includes old records and new subject-wise records.
  const attendanceRecords = student
    ? getStudentAttendance(student.id)
    : [];

  const presentRecords = attendanceRecords.filter(
    (record) => record.status === "Present"
  );

  const absentRecords = attendanceRecords.filter(
    (record) => record.status === "Absent"
  );

  const totalRecords = presentRecords.length + absentRecords.length;

  const attendancePercentage =
    totalRecords > 0
      ? Math.round(
          (presentRecords.length / totalRecords) * 100
        )
      : 0;

  const latestAttendance = [...attendanceRecords]
    .sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    )
    .slice(0, 10);

  // Calculate attendance grouped by subject.
  const subjectNames = [
    ...new Set(
      attendanceRecords
        .map((record) => record.subject)
        .filter(Boolean)
    )
  ];

  const subjectAttendance = subjectNames.map((subject) => {
    const records = attendanceRecords.filter(
      (record) => record.subject === subject
    );

    const present = records.filter(
      (record) => record.status === "Present"
    ).length;

    const absent = records.filter(
      (record) => record.status === "Absent"
    ).length;

    const total = present + absent;

    return {
      subject,
      present,
      absent,
      total,
      percentage:
        total > 0
          ? Math.round((present / total) * 100)
          : 0
    };
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!session || session.role !== "student") {
    return <Navigate to="/login" replace />;
  }

  if (!student) {
    return (
      <div className="student-dashboard">
        <div className="student-empty-state">
          <UserRound size={40} />
          <h2>Student account not found</h2>
          <p>
            We could not find your student profile.
            Please contact the administrator.
          </p>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <aside className="student-sidebar">
        <div className="student-brand">
          <GraduationCap size={30} />
          <div>
            <h2>Student Tracker</h2>
            <span>Student Portal</span>
          </div>
        </div>

        <nav className="student-navigation">
          <button
            className="student-nav-item active"
            onClick={() => navigate("/student")}
          >
            <BookOpen size={19} />
            Dashboard
          </button>

          <button
            className="student-nav-item"
            onClick={() => navigate("/student/attendance")}
          >
            <CalendarCheck size={19} />
            My Attendance
          </button>

          <button
            className="student-nav-item"
            onClick={() => navigate("/student/profile")}
          >
            <UserRound size={19} />
            My Profile
          </button>
        </nav>

        <button
          className="student-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main className="student-main">
        <header className="student-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome back, {student.name}</p>
          </div>

          <div className="student-profile">
            <span className="student-avatar">
              {student.name.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{student.name}</strong>
              <small>{student.id}</small>
            </div>
          </div>
        </header>

        <section className="student-welcome">
          <div>
            <h2>Hello, {student.name}!</h2>
            <p>
              View your attendance, subject-wise performance,
              and student information.
            </p>
          </div>

          <GraduationCap size={55} />
        </section>

        <section className="student-info-cards">
          <div className="student-info-card">
            <span>Student ID</span>
            <strong>{student.id}</strong>
          </div>

          <div className="student-info-card">
            <span>Class</span>
            <strong>
              {student.className ||
                `${student.class || ""}${
                  student.section ? `-${student.section}` : ""
                }`}
            </strong>
          </div>

          <div className="student-info-card">
            <span>Academic Year</span>
            <strong>{student.academicYear || "2026-2027"}</strong>
          </div>
        </section>

        <section className="student-stats">
          <div className="student-stat-card">
            <div className="student-stat-icon blue">
              <CalendarCheck size={23} />
            </div>

            <div>
              <span>Total Attendance</span>
              <h2>{totalRecords}</h2>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon green">
              <CheckCircle2 size={23} />
            </div>

            <div>
              <span>Present</span>
              <h2>{presentRecords.length}</h2>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon red">
              <XCircle size={23} />
            </div>

            <div>
              <span>Absent</span>
              <h2>{absentRecords.length}</h2>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon purple">
              <TrendingUp size={23} />
            </div>

            <div>
              <span>Attendance Percentage</span>
              <h2>{attendancePercentage}%</h2>
            </div>
          </div>
        </section>

        <section className="student-subject-section">
          <div className="student-section-heading">
            <h2>Subject-wise Attendance</h2>
          </div>

          {subjectAttendance.length === 0 ? (
            <div className="student-empty-state">
              <BookOpen size={32} />
              <p>
                Subject-wise attendance will appear here
                when faculty mark attendance with a subject.
              </p>
            </div>
          ) : (
            <div className="student-subject-list">
              {subjectAttendance.map((item) => (
                <div
                  className="student-subject-card"
                  key={item.subject}
                >
                  <div>
                    <h3>{item.subject}</h3>
                    <p>
                      Present: {item.present} | Absent: {item.absent}
                    </p>
                  </div>

                  <strong>{item.percentage}%</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="student-recent-section">
          <div className="student-section-heading">
            <h2>My Recent Attendance</h2>

            <button
              onClick={() => navigate("/student/attendance")}
            >
              View All
            </button>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="student-empty-state">
              <CalendarCheck size={35} />
              <h3>No attendance records yet</h3>
              <p>
                Your attendance records will appear here
                once marked by your faculty.
              </p>
            </div>
          ) : (
            <div className="student-table-wrapper">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {latestAttendance.map((record, index) => (
                    <tr
                      key={`${record.date}-${record.subject || "overall"}-${index}`}
                    >
                      <td>{record.date || "-"}</td>

                      <td>{record.subject || "Previously recorded"}</td>

                      <td>
                        <span
                          className={
                            record.status === "Present"
                              ? "attendance-status present"
                              : "attendance-status absent"
                          }
                        >
                          {record.status || "Not available"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="student-attendance-footer">
          <button
            onClick={() => navigate("/student/attendance")}
          >
            <ClipboardList size={18} />
            View Complete Attendance History
          </button>
        </section>
      </main>
    </div>
  );
}
