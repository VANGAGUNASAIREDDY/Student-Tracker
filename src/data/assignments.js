
import { generatedFacultyGroups } from "./faculty";

const legacyAssignments = [
  {
    id: "CSE-A-ENGLISH",
    facultyId: "FAC001",
    classNumber: null,
    className: "CSE-A",
    section: "",
    subject: "English",
    academicYear: "2026-2027"
  },
  {
    id: "CSE-A-MATHEMATICS",
    facultyId: "FAC002",
    classNumber: null,
    className: "CSE-A",
    section: "",
    subject: "Mathematics",
    academicYear: "2026-2027"
  }
];

const generatedAssignments = generatedFacultyGroups.flatMap((group) =>
  group.assignedClasses.map((item, index) => ({
    id: `${group.facultyId}-${item.classNumber}-${item.section}-${index}`,
    facultyId: group.facultyId,
    classNumber: item.classNumber,
    className: item.className,
    section: item.section,
    subject: group.subject,
    academicYear: item.academicYear
  }))
);

export const assignments = [
  ...legacyAssignments,
  ...generatedAssignments
];

export const getFacultyAssignments = (facultyId) =>
  assignments.filter((item) => item.facultyId === facultyId);

export const getSectionAssignments = (classNumber, section) =>
  assignments.filter(
    (item) =>
      Number(item.classNumber) === Number(classNumber) &&
      item.section === section
  );

export const hasFacultyAccess = (
  facultyId,
  classNumber,
  section,
  subject
) =>
  assignments.some(
    (item) =>
      item.facultyId === facultyId &&
      Number(item.classNumber) === Number(classNumber) &&
      item.section === section &&
      (!subject || item.subject === subject)
  );

export const getFacultyClassCount = (facultyId) => {
  const uniqueClasses = new Set(
    getFacultyAssignments(facultyId).map(
      (item) => `${item.className}-${item.section}`
    )
  );

  return uniqueClasses.size;
};

export default assignments;
