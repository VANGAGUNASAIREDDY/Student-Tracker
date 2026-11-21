
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  XCircle
} from "lucide-react";

import Login from "./pages/Login";
import OTP from "./pages/OTP";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AttendanceManagement from "./pages/AttendanceManagement";
import AttendanceReports from "./pages/AttendanceReports";
import StudentManagement from "./pages/StudentManagement";

import { getCurrentSession } from "./auth/auth";

import {
  initializeAppData,
  getStudents,
  getStudentAttendance
} from "./utils/storage";

import { initializeFacultyData } from "./utils/facultyUtils";

import "./styles/Global.css";
import "./styles/Dashboard.css";
import "./styles/StudentPages.css";

// Initialize demo data without overwriting existing records.
initializeAppData();
initializeFacultyData();

// ============================================
// PROTECTED ROUTE
// ============================================

function ProtectedRoute({ children, role }) {
  const session = getCurrentSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (role && session.role !== role) {
    return (
      <Navigate
        to={session.role === "faculty" ? "/faculty" : "/student"}
        replace
      />
    );
  }

  return children;
}

// ============================================
// STUDENT ATTENDANCE PAGE
// ============================================

function StudentAttendancePage() {
  const navigate = useNavigate();
  const session = getCurrentSession();

  const student = getStudents().find(
    (item) => String(item.id) === String(session?.id)
  );

  if (!student) {
    return (
      <div className="student-inner-page">
        <div className="student-inner-content">
          <h2>Student record not found</h2>

          <button
            className="student-back-button"
            onClick={() => navigate("/student")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fetch all attendance records for this student.
  // Do not filter by subject or faculty.
  const records = getStudentAttendance(student.id) || [];

  const presentDays = records.filter(
    (record) => record.status?.toLowerCase() === "present"
  ).length;

  const absentDays = records.filter(
    (record) => record.status?.toLowerCase() === "absent"
  ).length;

  const totalDays = presentDays + absentDays;

  const percentage = totalDays
    ? Math.round((presentDays / totalDays) * 100)
    : 0;

  const sortedRecords = [...records].sort(
    (a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
  );

  return (
    <div className="student-inner-page">
      <header className="student-inner-header">
        <h1>My Attendance</h1>

        <button
          className="student-back-button"
          onClick={() => navigate("/student")}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </header>

      <main className="student-inner-content">
        <section className="student-inner-intro">
          <h2>Attendance History</h2>
          <p>
            Your personal attendance details, {student.name}.
          </p>
        </section>

        {/* Attendance Statistics */}

        <section className="student-detail-stats">
          <div className="student-detail-stat">
            <span>Total Marked Days</span>
            <strong>{totalDays}</strong>
          </div>

          <div className="student-detail-stat">
            <span>Present Days</span>
            <strong>{presentDays}</strong>
          </div>

          <div className="student-detail-stat">
            <span>Absent Days</span>
            <strong>{absentDays}</strong>
          </div>

          <div className="student-detail-stat">
            <span>Attendance Percentage</span>
            <strong>{percentage}%</strong>
          </div>
        </section>

        {/* Attendance Records */}

        <section className="student-detail-panel">
          <div className="student-detail-panel-heading">
            <h3>
              <CalendarCheck
                size={17}
                style={{
                  verticalAlign: "middle",
                  marginRight: 8
                }}
              />
              Attendance Records
            </h3>
          </div>

          {sortedRecords.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="student-attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Record</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedRecords.map((record, index) => {
                    const status = record.status?.toLowerCase();

                    return (
                      <tr
                        key={`${record.date}-${record.subject || "overall"}-${index}`}
                      >
                        <td>{record.date || "-"}</td>

                        <td>
                          {record.subject || "Previously recorded"}
                        </td>

                        <td>
                          <span
                            className={`student-status ${
                              status === "present"
                                ? "present"
                                : status === "absent"
                                  ? "absent"
                                  : "other"
                            }`}
                          >
                            {record.status || "Not available"}
                          </span>
                        </td>

                        <td>
                          {status === "present" ? (
                            <span style={{ color: "#16834f" }}>
                              <CheckCircle2
                                size={15}
                                style={{
                                  verticalAlign: "middle",
                                  marginRight: 5
                                }}
                              />
                              Present
                            </span>
                          ) : status === "absent" ? (
                            <span style={{ color: "#c43d3d" }}>
                              <XCircle
                                size={15}
                                style={{
                                  verticalAlign: "middle",
                                  marginRight: 5
                                }}
                              />
                              Absent
                            </span>
                          ) : (
                            record.status || "Not available"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="student-no-records">
              <CalendarCheck size={28} />

              <h3>No attendance records available</h3>

              <p>
                Your attendance will appear here when it
                is marked by faculty.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ============================================
// STUDENT PROFILE PAGE
// ============================================

function StudentProfilePage() {
  const navigate = useNavigate();
  const session = getCurrentSession();

  const student = getStudents().find(
    (item) => String(item.id) === String(session?.id)
  );

  if (!student) {
    return (
      <div className="student-inner-page">
        <div className="student-inner-content">
          <h2>Student record not found</h2>

          <button
            className="student-back-button"
            onClick={() => navigate("/student")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const classDisplay =
    student.className ||
    [student.class, student.section]
      .filter(Boolean)
      .join("-") ||
    "Not assigned";

  const profileFields = [
    ["Student ID", student.id],
    ["Full Name", student.name],
    ["Gender", student.gender],
    ["Class", classDisplay],
    ["Section", student.section],
    ["Roll Number", student.rollNumber],
    ["Academic Year", student.academicYear],
    ["Email", student.email],
    ["Phone Number", student.phone || student.phoneNumber],
    ["Date of Birth", student.dateOfBirth || student.dob],
    ["Address", student.address]
  ].filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );

  return (
    <div className="student-inner-page">
      <header className="student-inner-header">
        <h1>My Profile</h1>

        <button
          className="student-back-button"
          onClick={() => navigate("/student")}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </header>

      <main className="student-inner-content">
        <section className="student-inner-intro">
          <h2>Personal Information</h2>
          <p>View your registered student details.</p>
        </section>

        <section className="student-profile-card">
          <div className="student-profile-banner">
            <div className="student-profile-avatar">
              {(student.name || "S")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h2>{student.name || "Student"}</h2>

              <p>
                {student.id} · {classDisplay}
              </p>
            </div>
          </div>

          <div className="student-profile-details">
            {profileFields.map(([label, value]) => (
              <div
                className="student-profile-field"
                key={label}
              >
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}

        <Route path="/" element={<Login />} />

        <Route path="/otp" element={<OTP />} />

        {/* Student Dashboard */}

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Attendance */}

        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute role="student">
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />

        {/* Student Profile */}

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="student">
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Faculty Dashboard */}

        <Route
          path="/faculty"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Faculty Attendance */}

        <Route
          path="/faculty/attendance"
          element={
            <ProtectedRoute role="faculty">
              <AttendanceManagement />
            </ProtectedRoute>
          }
        />

        {/* Faculty Reports */}

        <Route
          path="/faculty/reports"
          element={
            <ProtectedRoute role="faculty">
              <AttendanceReports />
            </ProtectedRoute>
          }
        />

        {/* Faculty Students */}

        <Route
          path="/faculty/students"
          element={
            <ProtectedRoute role="faculty">
              <StudentManagement />
            </ProtectedRoute>
          }
        />

        {/* Invalid Routes */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
