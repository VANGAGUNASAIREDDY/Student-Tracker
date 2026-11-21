
import { students as initialStudents } from "../data/students";
import {
  attendance as initialAttendance
} from "../data/attendance";

const STUDENTS_KEY = "studentTracker_students";
const ATTENDANCE_KEY = "studentTracker_attendance";

const additionalNames = [
  "Aarav", "Ananya", "Rahul", "Priya", "Kavya",
  "Arjun", "Sneha", "Rohan", "Divya", "Kiran",
  "Meera", "Vikram", "Pooja", "Aditya", "Sanjana",
  "Nikhil", "Swathi", "Varun", "Ishita", "Manoj"
];

const surnames = [
  "Sharma", "Reddy", "Kumar", "Rao", "Patel",
  "Singh", "Verma", "Nair", "Gupta", "Das"
];

const sections = ["A", "B", "C"];

const safeRead = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);

    if (!value) return fallback;

    const parsed = JSON.parse(value);

    return parsed ?? fallback;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Unable to save ${key}:`, error);
    return false;
  }
};

// Generate 1,440 demo students: 12 classes,
// 3 sections per class, 40 students per section.
const generateAdditionalStudents = () => {
  const generatedStudents = [];
  let studentNumber = 41;

  for (let classNumber = 1; classNumber <= 12; classNumber++) {
    for (const section of sections) {
      for (let rollNumber = 1; rollNumber <= 40; rollNumber++) {
        const id = `STU${String(studentNumber).padStart(3, "0")}`;

        const firstName =
          additionalNames[(studentNumber - 41) % additionalNames.length];

        const surname =
          surnames[
            Math.floor((studentNumber - 41) / additionalNames.length) %
              surnames.length
          ];

        generatedStudents.push({
          id,
          password: `Student@${studentNumber}`,
          name: `${firstName} ${surname}`,
          gender: studentNumber % 2 === 0 ? "Male" : "Female",
          class: `Class ${classNumber}`,
          section,
          className: `Class ${classNumber}-${section}`,
          rollNumber,
          academicYear: "2026-2027"
        });

        studentNumber++;
      }
    }
  }

  return generatedStudents;
};

const generatedStudents = generateAdditionalStudents();

const normalizeAttendance = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data;
};

// Initialize data without overwriting existing records.
export const initializeAppData = () => {
  const storedStudents = safeRead(STUDENTS_KEY, null);
  const storedAttendance = safeRead(ATTENDANCE_KEY, null);

  const currentStudents = Array.isArray(storedStudents)
    ? storedStudents
    : [...(Array.isArray(initialStudents) ? initialStudents : [])];

  const existingIds = new Set(
    currentStudents.map((student) => student.id)
  );

  const newStudents = generatedStudents.filter(
    (student) => !existingIds.has(student.id)
  );

  const mergedStudents = [
    ...currentStudents,
    ...newStudents
  ];

  const currentAttendance = storedAttendance !== null
    ? normalizeAttendance(storedAttendance)
    : normalizeAttendance(initialAttendance);

  const mergedAttendance = {
    ...currentAttendance
  };

  // Add empty attendance history only for newly generated students.
  // Never replace existing attendance records.
  newStudents.forEach((student) => {
    if (!Array.isArray(mergedAttendance[student.id])) {
      mergedAttendance[student.id] = [];
    }
  });

  safeWrite(STUDENTS_KEY, mergedStudents);
  safeWrite(ATTENDANCE_KEY, mergedAttendance);
};

export const getStudents = () => {
  const stored = safeRead(STUDENTS_KEY, null);

  return Array.isArray(stored)
    ? stored
    : Array.isArray(initialStudents)
      ? initialStudents
      : [];
};

export const saveStudents = (studentData) => {
  if (!Array.isArray(studentData)) {
    throw new Error("Student data must be an array.");
  }

  return safeWrite(STUDENTS_KEY, studentData);
};

export const getAttendance = () => {
  const stored = safeRead(ATTENDANCE_KEY, null);

  return normalizeAttendance(
    stored !== null ? stored : initialAttendance
  );
};

export const saveAttendance = (attendanceData) => {
  if (
    !attendanceData ||
    typeof attendanceData !== "object" ||
    Array.isArray(attendanceData)
  ) {
    throw new Error("Attendance data must be an object.");
  }

  return safeWrite(ATTENDANCE_KEY, attendanceData);
};

// Return every attendance record belonging to one student.
// Do not filter by faculty or subject here.
export const getStudentAttendance = (studentId) => {
  if (!studentId) return [];

  const attendanceData = getAttendance();

  const records = attendanceData[studentId];

  return Array.isArray(records) ? records : [];
};

export const addStudent = (student) => {
  if (!student || !student.id) {
    throw new Error("A valid student with an ID is required.");
  }

  const currentStudents = getStudents();

  if (currentStudents.some((item) => item.id === student.id)) {
    throw new Error("A student with this ID already exists.");
  }

  const updatedStudents = [...currentStudents, student];

  const saved = saveStudents(updatedStudents);

  if (saved) {
    const currentAttendance = getAttendance();

    if (!Array.isArray(currentAttendance[student.id])) {
      currentAttendance[student.id] = [];
      saveAttendance(currentAttendance);
    }
  }

  return saved;
};

export const updateStudent = (studentId, updatedData) => {
  const currentStudents = getStudents();

  const updatedStudents = currentStudents.map((student) =>
    student.id === studentId
      ? { ...student, ...updatedData, id: studentId }
      : student
  );

  return saveStudents(updatedStudents);
};

export const deleteStudent = (studentId) => {
  const updatedStudents = getStudents().filter(
    (student) => student.id !== studentId
  );

  const updatedAttendance = { ...getAttendance() };

  delete updatedAttendance[studentId];

  saveStudents(updatedStudents);
  saveAttendance(updatedAttendance);
};

export const resetAppData = () => {
  localStorage.removeItem(STUDENTS_KEY);
  localStorage.removeItem(ATTENDANCE_KEY);

  initializeAppData();
};
