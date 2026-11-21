
import { subjectsByClass } from "./subjects";

const MAX_CLASSES_PER_FACULTY = 5;
const sections = ["A", "B", "C"];

const legacyFaculty = [
  {
    id: "FAC001",
    password: "Faculty@123",
    name: "Arjun Sharma",
    department: "Languages Department",
    designation: "Senior Faculty",
    primarySubject: "English"
  },
  {
    id: "FAC002",
    password: "Faculty@456",
    name: "Priya Reddy",
    department: "Mathematics Department",
    designation: "Senior Faculty",
    primarySubject: "Mathematics"
  }
];

const names = [
  "Aarav Sharma",
  "Ananya Reddy",
  "Rahul Kumar",
  "Priya Sharma",
  "Kavya Rao",
  "Arjun Reddy",
  "Sneha Patel",
  "Rohan Verma",
  "Divya Nair",
  "Kiran Kumar",
  "Meera Singh",
  "Vikram Rao",
  "Pooja Sharma",
  "Aditya Reddy",
  "Sanjana Kumar",
  "Nikhil Verma",
  "Swathi Rao",
  "Varun Patel",
  "Ishita Sharma",
  "Manoj Kumar"
];

const getDepartment = (subject) => {
  if (["Mathematics"].includes(subject)) {
    return "Mathematics Department";
  }

  if (
    ["Science", "Physics", "Chemistry", "Biology", "EVS"].includes(subject)
  ) {
    return "Science Department";
  }

  if (
    ["History", "Geography", "Civics", "Social Studies", "Political Science"].includes(subject)
  ) {
    return "Social Studies Department";
  }

  if (
    ["Computer", "Computer Science"].includes(subject)
  ) {
    return "Computer Science Department";
  }

  if (
    ["Economics", "Accountancy", "Business Studies"].includes(subject)
  ) {
    return "Commerce Department";
  }

  return "Languages and Activities Department";
};

export const generatedFacultyGroups = [];

let facultyNumber = 3;

Object.entries(subjectsByClass).forEach(([classNumber, subjects]) => {
  subjects.forEach((subject) => {
    sections.forEach((section) => {
      const existingGroup = generatedFacultyGroups.find(
        (group) =>
          group.subject === subject &&
          group.assignedClasses.length < MAX_CLASSES_PER_FACULTY
      );

      const assignment = {
        classNumber: Number(classNumber),
        className: `Class ${classNumber}`,
        section,
        subject,
        academicYear: "2026-2027"
      };

      if (existingGroup) {
        existingGroup.assignedClasses.push(assignment);
      } else {
        const id = `FAC${String(facultyNumber).padStart(3, "0")}`;

        generatedFacultyGroups.push({
          facultyId: id,
          subject,
          assignedClasses: [assignment]
        });

        facultyNumber++;
      }
    });
  });
});

const generatedFaculty = generatedFacultyGroups.map((group, index) => ({
  id: group.facultyId,
  password: `Faculty@${Number(group.facultyId.slice(3)) * 100}`,
  name: names[index % names.length],
  department: getDepartment(group.subject),
  designation: "Faculty",
  primarySubject: group.subject
}));

export const faculty = [
  ...legacyFaculty,
  ...generatedFaculty
];

export const getFacultyById = (facultyId) =>
  faculty.find((item) => item.id === facultyId);

export default faculty;
