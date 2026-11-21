
import faculty from "../data/faculty";
import { assignments as demoAssignments } from "../data/assignments";

const FACULTY_KEY = "studentTracker_faculty";
const ASSIGNMENTS_KEY = "studentTracker_facultyAssignments";

const MAX_CLASSES_PER_FACULTY = 5;

const readStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

export const initializeFacultyData = () => {
  // Do not overwrite existing saved faculty or assignments.
  if (!localStorage.getItem(FACULTY_KEY)) {
    writeStorage(FACULTY_KEY, faculty);
  }

  if (!localStorage.getItem(ASSIGNMENTS_KEY)) {
    writeStorage(ASSIGNMENTS_KEY, demoAssignments);
  }
};

export const getFaculty = () =>
  readStorage(FACULTY_KEY, faculty);

export const saveFaculty = (facultyData) => {
  if (!Array.isArray(facultyData)) {
    throw new Error("Faculty data must be an array.");
  }

  return writeStorage(FACULTY_KEY, facultyData);
};

export const getAllFacultyAssignments = () =>
  readStorage(ASSIGNMENTS_KEY, demoAssignments);

export const saveFacultyAssignments = (assignmentData) => {
  if (!Array.isArray(assignmentData)) {
    throw new Error("Assignment data must be an array.");
  }

  const classCounts = new Map();

  assignmentData.forEach((assignment) => {
    if (!classCounts.has(assignment.facultyId)) {
      classCounts.set(assignment.facultyId, new Set());
    }

    classCounts.get(assignment.facultyId).add(
      `${assignment.className}-${assignment.section || ""}`
    );
  });

  for (const [facultyId, classes] of classCounts.entries()) {
    if (classes.size > MAX_CLASSES_PER_FACULTY) {
      throw new Error(
        `${facultyId} cannot have more than 5 class-section combinations.`
      );
    }
  }

  return writeStorage(ASSIGNMENTS_KEY, assignmentData);
};

export const getAssignmentsForFaculty = (facultyId) =>
  getAllFacultyAssignments().filter(
    (item) => item.facultyId === facultyId
  );

export const getFacultySubjects = (facultyId) => {
  const subjects = getAssignmentsForFaculty(facultyId).map(
    (item) => item.subject
  );

  return [...new Set(subjects)];
};

export const getFacultyClassCount = (facultyId) => {
  const uniqueClasses = new Set(
    getAssignmentsForFaculty(facultyId).map(
      (item) => `${item.className}-${item.section || ""}`
    )
  );

  return uniqueClasses.size;
};

export const hasFacultyAssignment = (
  facultyId,
  classNumber,
  section,
  subject
) =>
  getAssignmentsForFaculty(facultyId).some(
    (item) =>
      Number(item.classNumber) === Number(classNumber) &&
      item.section === section &&
      (!subject || item.subject === subject)
  );

export const hasFacultyClassAccess = (
  facultyId,
  className,
  section
) =>
  getAssignmentsForFaculty(facultyId).some(
    (item) =>
      item.className === className &&
      (item.section || "") === (section || "")
  );
