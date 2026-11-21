
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  ArrowLeft,
  GraduationCap,
  LayoutDashboard
} from "lucide-react";

import { getCurrentSession } from "../auth/auth";

import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getAttendance
} from "../utils/storage";

import { getAssignmentsForFaculty } from "../utils/facultyUtils";

import "../styles/StudentManagement.css";

const emptyForm = {
  name: "",
  gender: "",
  email: "",
  phone: "",
  className: "",
  section: ""
};

function StudentManagement() {
  const navigate = useNavigate();
  const session = getCurrentSession();

  const [students, setStudents] = useState(
    () => getStudents() || []
  );

  const [attendance] = useState(
    () => getAttendance() || {}
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  if (!session || session.role !== "faculty") {
    return <Navigate to="/" replace />;
  }

  const assignments = getAssignmentsForFaculty(session.id);

  const assignedClasses = [
    ...new Set(
      assignments.map((item) =>
        item.className === "CSE-A"
          ? "CSE-A"
          : `${item.className}-${item.section}`
      )
    )
  ];

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

  const assignedStudents = students.filter(hasAccess);

  const filteredStudents = assignedStudents.filter((student) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      (student.name || "").toLowerCase().includes(search) ||
      String(student.id || "").toLowerCase().includes(search)
    );
  });

  const getStudentRecords = (studentId) => {
    if (Array.isArray(attendance)) {
      return attendance.filter(
        (record) => record.studentId === studentId
      );
    }

    const records = attendance?.[studentId];

    if (Array.isArray(records)) {
      return records;
    }

    if (records && typeof records === "object") {
      return Object.entries(records).map(([date, value]) => ({
        date,
        ...(typeof value === "object" && value !== null
          ? value
          : { status: value })
      }));
    }

    return [];
  };

  const getStudentStats = (studentId) => {
    const records = getStudentRecords(studentId);

    const present = records.filter(
      (record) =>
        String(record.status || "").toLowerCase() === "present"
    ).length;

    const absent = records.filter(
      (record) =>
        String(record.status || "").toLowerCase() === "absent"
    ).length;

    const total = present + absent;

    const percentage =
      total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      records: [...records].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      ),
      present,
      absent,
      total,
      percentage
    };
  };

  const formatDate = (date) => {
    if (!date) return "—";

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

  const getClassLabel = (student) => {
    if (student.className) {
      return student.className;
    }

    if (student.class && student.section) {
      return `${student.class}-${student.section}`;
    }

    return student.class || "—";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const openAddForm = () => {
    setEditingId(null);

    const firstClass = assignedClasses[0] || "";
    const [className, section] = firstClass.split("-");

    setForm({
      ...emptyForm,
      className:
        firstClass === "CSE-A" ? "CSE" : className || "",
      section: section || "A"
    });

    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (student) => {
    if (!hasAccess(student)) {
      setMessage("You cannot edit this student.");
      return;
    }

    setEditingId(student.id);

    const studentClass =
      student.className || student.class || "";

    const isLegacyClass = studentClass === "CSE-A";

    setForm({
      name: student.name || "",
      gender: student.gender || "",
      email: student.email || "",
      phone: student.phone || "",
      className: isLegacyClass
        ? "CSE"
        : student.class || studentClass.replace(/-[A-C]$/, ""),
      section:
        student.section ||
        studentClass.match(/-([A-C])$/)?.[1] ||
        "A"
    });

    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const className = form.className;
    const section = form.section;

    const selectedClass =
      className === "CSE"
        ? "CSE-A"
        : `${className}-${section}`;

    if (!assignedClasses.includes(selectedClass)) {
      setMessage(
        "You are not assigned to this class and section."
      );
      return;
    }

    if (!form.name.trim()) {
      setMessage("Please enter the student name.");
      return;
    }

    const duplicate = students.some(
      (student) =>
        student.id !== editingId &&
        (student.name || "").toLowerCase() ===
          form.name.trim().toLowerCase() &&
        (
          student.className === selectedClass ||
          student.class === selectedClass
        )
    );

    if (duplicate) {
      setMessage(
        "A student with this name already exists in this class."
      );
      return;
    }

    const studentData = {
      ...form,
      name: form.name.trim(),
      className: selectedClass,
      class: className,
      section,
      academicYear: "2026-2027"
    };

    if (editingId) {
      const existing = students.find(
        (student) => student.id === editingId
      );

      if (!existing || !hasAccess(existing)) {
        setMessage("You cannot edit this student.");
        return;
      }

      updateStudent(editingId, studentData);
    } else {
      addStudent(studentData);
    }

    setStudents(getStudents() || []);
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setMessage("Student saved successfully.");
  };

  const handleDelete = (student) => {
    if (!hasAccess(student)) {
      setMessage("You cannot delete this student.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    deleteStudent(student.id);
    setStudents(getStudents() || []);

    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null);
    }

    setMessage("Student deleted successfully.");
  };

  const handleBackToStudents = () => {
    setSelectedStudent(null);
    setMessage("");
  };

  // Individual student dashboard.
  if (selectedStudent) {
    const stats = getStudentStats(selectedStudent.id);

    return (
      <div className="student-management-page">

        <div className="student-details-page-header">
          <button
            type="button"
            className="student-back-button"
            onClick={handleBackToStudents}
          >
            <ArrowLeft size={18} />
            Back to Students
          </button>

          <div>
            <h1>Student Details Dashboard</h1>
            <p>Student profile and attendance overview</p>
          </div>
        </div>

        {/* Student Profile */}
        <section className="student-profile-card">

          <div className="student-profile-avatar">
            <User size={38} />
          </div>

          <div className="student-profile-main">
            <h2>{selectedStudent.name}</h2>

            <p>Student ID: {selectedStudent.id}</p>

            <span className="student-class-badge">
              <GraduationCap size={15} />
              {getClassLabel(selectedStudent)}
            </span>
          </div>

        </section>

        {/* Personal Information */}
        <section className="student-details-section">

          <div className="student-section-heading">
            <div>
              <span className="student-section-icon">
                <User size={19} />
              </span>
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Basic student information</p>
            </div>
          </div>

          <div className="student-info-grid">

            <div className="student-info-item">
              <User />
              <div>
                <small>Full Name</small>
                <strong>{selectedStudent.name || "—"}</strong>
              </div>
            </div>

            <div className="student-info-item">
              <GraduationCap />
              <div>
                <small>Class</small>
                <strong>{getClassLabel(selectedStudent)}</strong>
              </div>
            </div>

            <div className="student-info-item">
              <Users />
              <div>
                <small>Gender</small>
                <strong>{selectedStudent.gender || "—"}</strong>
              </div>
            </div>

            <div className="student-info-item">
              <Mail />
              <div>
                <small>Email</small>
                <strong>{selectedStudent.email || "—"}</strong>
              </div>
            </div>

            <div className="student-info-item">
              <Phone />
              <div>
                <small>Phone</small>
                <strong>{selectedStudent.phone || "—"}</strong>
              </div>
            </div>

            <div className="student-info-item">
              <CalendarCheck />
              <div>
                <small>Academic Year</small>
                <strong>
                  {selectedStudent.academicYear || "2026-2027"}
                </strong>
              </div>
            </div>

          </div>
        </section>

        {/* Attendance Overview */}
        <section className="student-details-section">

          <div className="student-section-heading">
            <div className="student-section-icon attendance-icon">
              <CalendarCheck size={19} />
            </div>

            <div>
              <h2>Attendance Overview</h2>
              <p>Summary of recorded attendance</p>
            </div>
          </div>

          <div className="student-attendance-stats">

            <div className="student-attendance-stat total-stat">
              <span className="attendance-stat-icon">
                <CalendarCheck />
              </span>
              <span className="attendance-stat-label">
                Total Days
              </span>
              <strong>{stats.total}</strong>
            </div>

            <div className="student-attendance-stat present-stat">
              <span className="attendance-stat-icon">
                <CheckCircle2 />
              </span>
              <span className="attendance-stat-label">
                Present Days
              </span>
              <strong>{stats.present}</strong>
            </div>

            <div className="student-attendance-stat absent-stat">
              <span className="attendance-stat-icon">
                <XCircle />
              </span>
              <span className="attendance-stat-label">
                Absent Days
              </span>
              <strong>{stats.absent}</strong>
            </div>

            <div className="student-attendance-stat percentage-stat">
              <span className="attendance-stat-icon">
                <Clock />
              </span>
              <span className="attendance-stat-label">
                Attendance
              </span>
              <strong>{stats.percentage}%</strong>
            </div>

          </div>

          <div className="student-attendance-progress">

            <div className="attendance-progress-heading">
              <strong>Attendance Percentage</strong>
              <strong>{stats.percentage}%</strong>
            </div>

            <div
              className="attendance-progress-track"
              role="progressbar"
              aria-valuenow={stats.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Student attendance percentage"
            >
              <div
                className="attendance-progress-fill"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            <p>
              {stats.total === 0
                ? "No attendance has been recorded yet."
                : `${stats.present} present out of ${stats.total} recorded days.`}
            </p>

          </div>

        </section>

        {/* Attendance History */}
        <section className="student-details-section">

          <div className="student-section-heading">
            <div className="student-section-icon history-icon">
              <Clock size={19} />
            </div>

            <div>
              <h2>Attendance History</h2>
              <p>Daily attendance records</p>
            </div>
          </div>

          <div className="student-history-table-wrapper">

            <table className="student-history-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {stats.records.length === 0 ? (

                  <tr>
                    <td colSpan="2" className="student-empty-history">
                      <CalendarCheck size={30} />
                      <span>No attendance records available.</span>
                    </td>
                  </tr>

                ) : (

                  stats.records.map((record, index) => {
                    const isPresent =
                      String(record.status || "").toLowerCase() ===
                      "present";

                    return (
                      <tr key={`${record.date}-${index}`}>
                        <td>{formatDate(record.date)}</td>

                        <td>
                          <span
                            className={
                              isPresent
                                ? "student-status-badge present"
                                : "student-status-badge absent"
                            }
                          >
                            {isPresent ? (
                              <CheckCircle2 size={15} />
                            ) : (
                              <XCircle size={15} />
                            )}

                            {record.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    );
                  })

                )}

              </tbody>
            </table>

          </div>

        </section>

      </div>
    );
  }

  // Main student management page.
  return (
    <div className="student-management-page">

      {/* Page Header */}
      <header className="student-management-header">

        <div className="student-management-heading-content">

          <button
            type="button"
            className="student-back-dashboard-button"
            onClick={() => navigate("/faculty")}
          >
            <LayoutDashboard size={17} />
            Back to Dashboard
          </button>

          <h1>Student Management</h1>

          <p>
            Manage students in your assigned classes and sections.
          </p>

        </div>

        <button
          type="button"
          className="student-add-button"
          onClick={openAddForm}
          disabled={assignedClasses.length === 0}
        >
          <Plus size={18} />
          Add Student
        </button>

      </header>

      {/* Statistics */}
      <section className="student-management-stats">

        <div className="student-summary-card">
          <div className="student-summary-icon blue">
            <Users size={23} />
          </div>

          <div>
            <span>Assigned Students</span>
            <strong>{assignedStudents.length}</strong>
          </div>
        </div>

        <div className="student-summary-card">
          <div className="student-summary-icon purple">
            <GraduationCap size={23} />
          </div>

          <div>
            <span>Assigned Classes</span>
            <strong>{assignedClasses.length}</strong>
          </div>
        </div>

      </section>

      {/* Student Table */}
      <section className="student-management-panel">

        <div className="student-management-toolbar">

          <div>
            <h2>My Students</h2>
            <p>Click a student's name to view their dashboard.</p>
          </div>

          <div className="student-management-search">
            <Search size={18} />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search student name or ID"
            />
          </div>

        </div>

        {message && (
          <p
            role="status"
            className="student-management-message"
          >
            {message}
          </p>
        )}

        <div className="student-management-table-wrapper">

          <table className="student-management-table">

            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Gender</th>
                <th>Class</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filteredStudents.length === 0 ? (

                <tr>
                  <td colSpan="6" className="student-table-empty">
                    {assignments.length === 0
                      ? "No classes have been assigned to you."
                      : "No students found in your assigned classes."}
                  </td>
                </tr>

              ) : (

                filteredStudents.map((student) => (

                  <tr key={student.id}>

                    <td className="student-id-cell">
                      {student.id}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="student-name-link"
                        onClick={() => setSelectedStudent(student)}
                      >
                        {student.name}
                      </button>
                    </td>

                    <td>{student.gender || "—"}</td>

                    <td>
                      <span className="student-table-class">
                        {getClassLabel(student)}
                      </span>
                    </td>

                    <td>{student.email || "—"}</td>

                    <td>
                      <div className="student-action-buttons">

                        <button
                          type="button"
                          className="student-edit-button"
                          title="Edit student"
                          onClick={() => openEditForm(student)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="student-delete-button"
                          title="Delete student"
                          onClick={() => handleDelete(student)}
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        <div className="student-management-footer">
          Showing {filteredStudents.length} of{" "}
          {assignedStudents.length} assigned students
        </div>

      </section>

      {/* Add / Edit Modal */}
      {showForm && (

        <div className="student-management-modal">

          <form
            className="student-management-form"
            onSubmit={handleSubmit}
          >

            <div className="student-management-modal-header">

              <div>
                <h2>
                  {editingId ? "Edit Student" : "Add Student"}
                </h2>
                <p>Enter the student's information below.</p>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>

            </div>

            <label>
              Student Name

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter student name"
                required
              />
            </label>

            <label>
              Gender

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Email

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </label>

            <label>
              Phone

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </label>

            <label>
              Assigned Class and Section

              <select
                value={
                  form.className === "CSE"
                    ? "CSE-A"
                    : `${form.className}-${form.section}`
                }
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === "CSE-A") {
                    setForm((previous) => ({
                      ...previous,
                      className: "CSE",
                      section: "A"
                    }));
                  } else {
                    const [className, section] =
                      value.split("-");

                    setForm((previous) => ({
                      ...previous,
                      className,
                      section
                    }));
                  }
                }}
                required
              >
                {assignedClasses.map((className) => (
                  <option
                    key={className}
                    value={className}
                  >
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <div className="student-management-modal-actions">

              <button
                type="button"
                className="student-cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="student-save-button"
              >
                <Save size={17} />
                Save Student
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}

export default StudentManagement;
