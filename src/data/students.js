
// src/data/students.js

const maleNames = [
  "Aarav Sharma",
  "Arjun Reddy",
  "Rahul Kumar",
  "Vikram Singh",
  "Karthik Rao",
  "Sai Krishna",
  "Aditya Verma",
  "Rohan Das",
  "Varun Patel",
  "Nikhil Gupta",
  "Manoj Kumar",
  "Sandeep Reddy",
  "Harish Babu",
  "Pranav Joshi",
  "Akash Sharma",
  "Ravi Teja",
  "Surya Prakash",
  "Abhishek Roy",
  "Deepak Kumar",
  "Charan Reddy"
];

const femaleNames = [
  "Ananya Sharma",
  "Priya Reddy",
  "Sneha Kumar",
  "Divya Singh",
  "Kavya Rao",
  "Sravya Krishna",
  "Aadhya Verma",
  "Pooja Das",
  "Meera Patel",
  "Neha Gupta",
  "Manasa Kumar",
  "Sravani Reddy",
  "Harika Babu",
  "Pranavi Joshi",
  "Akshaya Sharma",
  "Ramya Teja",
  "Sowmya Prakash",
  "Abhilasha Roy",
  "Deepika Kumar",
  "Chandana Reddy"
];

export const students = [
  ...maleNames.map((name, index) => ({
    id: `STU${String(index + 1).padStart(3, "0")}`,
    password: `Student@${index + 1}`,
    name,
    gender: "Male",
    class: "CSE-A",
    academicYear: "2026-2027"
  })),

  ...femaleNames.map((name, index) => ({
    id: `STU${String(index + 21).padStart(3, "0")}`,
    password: `Student@${index + 21}`,
    name,
    gender: "Female",
    class: "CSE-A",
    academicYear: "2026-2027"
  }))
];

export default students;
