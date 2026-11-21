
import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  Save,
  ArrowLeft,
  LogOut
} from "lucide-react";

import { getCurrentSession, logout } from "../auth/auth";

import {
  getStudents,
  getAttendance,
  saveAttendance
} from "../utils/storage";

import {
  getAssignmentsForFaculty
} from "../utils/facultyUtils";

import "../styles/AttendanceManagement.css";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const matchesAssignment = (student, assignment) => {
  if (!student || !assignment) return false;

  if (!assignment.classNumber && assignment.className) {
    const studentClass =
      student.className ||
      student.class ||
      "";

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

export default function AttendanceManagement() {
  const navigate = useNavigate();

  const session = getCurrentSession();
  const facultyId = session?.id;

  const assignments = useMemo(
    () => getAssignmentsForFaculty(facultyId) || [],
    [facultyId]
  );

  const allStudents = useMemo(
    () => getStudents() || [],
    []
  );

  const attendanceData = useMemo(
    () => getAttendance() || {},
    []
  );

  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState("");

  const [selectedDate, setSelectedDate] = useState(today());

  const [search, setSearch] = useState("");

  const [attendanceStatus, setAttendanceStatus] = useState({});

  const [message, setMessage] = useState("");

  const selectedAssignment = useMemo(() => {
    return (
      assignments.find(
        (item) => item.id === selectedAssignmentId
      ) || assignments[0] || null
    );
  }, [assignments, selectedAssignmentId]);

  const assignedStudents = useMemo(() => {
    if (!selectedAssignment) return [];

    return allStudents.filter((student) =>
      matchesAssignment(student, selectedAssignment)
    );
  }, [allStudents, selectedAssignment]);

  const subject = selectedAssignment?.subject || "";

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignedStudents;

    return assignedStudents.filter((student) =>
      [
        student.name,
        student.id,
        student.rollNumber
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [assignedStudents, search]);

  const getExistingStatus = (studentId) => {
    const records = attendanceData[studentId] || [];

    const existing = records.find(
      (record) =>
        record.date === selectedDate &&
        record.subject === subject &&
        record.markedBy === facultyId
    );

    return existing?.status || "";
  };

  const getStatus = (studentId) =>
    attendanceStatus[studentId] ?? getExistingStatus(studentId);

  const presentCount = assignedStudents.filter(
    (student) => getStatus(student.id) === "Present"
  ).length;

  const absentCount = assignedStudents.filter(
    (student) => getStatus(student.id) === "Absent"
  ).length;

  const markedCount = presentCount + absentCount;

  const handleStatusChange = (studentId, status) => {
    setAttendanceStatus((previous) => ({
      ...previous,
      [studentId]: status
    }));

    setMessage("");
  };

  const markAll = (status) => {
    const updates = {};

    assignedStudents.forEach((student) => {
      updates[student.id] = status;
    });

    setAttendanceStatus((previous) => ({
      ...previous,
      ...updates
    }));

    setMessage("");
  };

  const handleSave = () => {
    if (!selectedAssignment || !subject) {
      setMessage("Please select an assigned class.");
      return;
    }

    if (markedCount === 0) {
      setMessage("Please mark attendance before saving.");
      return;
    }

    // Start with the existing attendance data so that
    // records for other subjects and faculty are preserved.
    const latestAttendance = getAttendance() || {};

    const updatedAttendance = {
      ...latestAttendance
    };

    assignedStudents.forEach((student) => {
      const studentId = student.id;
      const status = getStatus(studentId);

      if (!status) return;

      const existingRecords = [
        ...(updatedAttendance[studentId] || [])
      ];

      const matchingIndex = existingRecords.findIndex(
        (record) =>
          record.date === selectedDate &&
          record.subject === subject &&
          record.markedBy === facultyId
      );

      const newRecord = {
        date: selectedDate,
        status,
        subject,
        markedBy: facultyId
      };

      if (matchingIndex >= 0) {
        existingRecords[matchingIndex] = newRecord;
      } else {
        existingRecords.push(newRecord);
      }

      updatedAttendance[studentId] = existingRecords;
    });

    saveAttendance(updatedAttendance);

    setMessage("Attendance saved successfully.");
    setAttendanceStatus({});
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Keep all hooks above this return.
  if (!session || session.role !== "faculty") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="attendance-management">
      <header className="attendance-page-header">
        <div className="attendance-header-left">
          <button
            className="attendance-back-button"
            onClick={() => navigate("/faculty")}
          >
            <ArrowLeft size={19} />
            Dashboard
          </button>

          <div>
            <h1>Attendance Management</h1>
            <p>Mark attendance for your assigned subject.</p>
          </div>
        </div>

        <button
          className="attendance-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <main className="attendance-content">
        <section className="attendance-selection-card">
          <div className="attendance-filter">
            <label htmlFor="assignment">
              Select Assigned Class and Subject
            </label>

            <select
              id="assignment"
              value={selectedAssignment?.id || ""}
              onChange={(event) => {
                setSelectedAssignmentId(event.target.value);
                setAttendanceStatus({});
                setMessage("");
              }}
            >
              {assignments.map((assignment) => (
                <option
                  key={assignment.id}
                  value={assignment.id}
                >
                  {assignment.className}
                  {assignment.section
                    ? `-${assignment.section}`
                    : ""}
                  {" - "}
                  {assignment.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-date">
              Attendance Date
            </label>

            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setAttendanceStatus({});
                setMessage("");
              }}
              max={today()}
            />
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-search">
              Search Students
            </label>

            <div className="attendance-search-box">
              <Search size={18} />

              <input
                id="attendance-search"
                type="text"
                placeholder="Search by name, ID or roll number"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </section>

        {assignments.length === 0 ? (
          <section className="attendance-empty">
            <Users size={38} />
            <h2>No classes assigned</h2>
            <p>
              Contact the administrator to receive a class
              and subject assignment.
            </p>
          </section>
        ) : (
          <>
            <section className="attendance-summary">
              <div className="attendance-summary-card">
                <Users size={22} />
                <div>
                  <span>Assigned Students</span>
                  <strong>{assignedStudents.length}</strong>
                </div>
              </div>

              <div className="attendance-summary-card">
                <CheckCircle2 size={22} />
                <div>
                  <span>Present</span>
                  <strong>{presentCount}</strong>
                </div>
              </div>

              <div className="attendance-summary-card">
                <XCircle size={22} />
                <div>
                  <span>Absent</span>
                  <strong>{absentCount}</strong>
                </div>
              </div>

              <div className="attendance-summary-card">
                <CalendarCheck size={22} />
                <div>
                  <span>Marked</span>
                  <strong>
                    {markedCount}/{assignedStudents.length}
                  </strong>
                </div>
              </div>
            </section>

            <section className="attendance-list-card">
              <div className="attendance-list-header">
                <div>
                  <h2>Student Attendance</h2>
                  <p>
                    {selectedAssignment?.className}
                    {selectedAssignment?.section
                      ? `-${selectedAssignment.section}`
                      : ""}
                    {" | "}
                    {subject}
                  </p>
                </div>

                <div className="attendance-quick-actions">
                  <button
                    type="button"
                    onClick={() => markAll("Present")}
                  >
                    Mark All Present
                  </button>

                  <button
                    type="button"
                    onClick={() => markAll("Absent")}
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {visibleStudents.length === 0 ? (
                <div className="attendance-empty">
                  <Users size={35} />
                  <p>No students found for this assignment.</p>
                </div>
              ) : (
                <div className="attendance-table-wrapper">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Roll No.</th>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleStudents.map((student, index) => {
                        const status = getStatus(student.id);

                        return (
                          <tr key={student.id}>
                            <td>
                              {student.rollNumber || index + 1}
                            </td>

                            <td>{student.id}</td>

                            <td>{student.name}</td>

                            <td>
                              <div className="attendance-status-actions">
                                <button
                                  type="button"
                                  className={
                                    status === "Present"
                                      ? "status-button present selected"
                                      : "status-button present"
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      student.id,
                                      "Present"
                                    )
                                  }
                                >
                                  <CheckCircle2 size={16} />
                                  Present
                                </button>

                                <button
                                  type="button"
                                  className={
                                    status === "Absent"
                                      ? "status-button absent selected"
                                      : "status-button absent"
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      student.id,
                                      "Absent"
                                    )
                                  }
                                >
                                  <XCircle size={16} />
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="attendance-save-area">
                {message && (
                  <p className="attendance-message">{message}</p>
                )}

                <button
                  type="button"
                  className="attendance-save-button"
                  onClick={handleSave}
                  disabled={assignedStudents.length === 0}
                >
                  <Save size={18} />
                  Save Attendance
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
