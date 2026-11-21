
export const subjectsByClass = {
  1: [
    "English",
    "Mathematics",
    "EVS",
    "Hindi",
    "Computer",
    "Art",
    "Physical Education"
  ],

  2: [
    "English",
    "Mathematics",
    "EVS",
    "Hindi",
    "Computer",
    "Art",
    "Physical Education"
  ],

  3: [
    "English",
    "Mathematics",
    "EVS",
    "Hindi",
    "Computer",
    "Art",
    "Physical Education"
  ],

  4: [
    "English",
    "Mathematics",
    "EVS",
    "Hindi",
    "Computer",
    "Art",
    "Physical Education"
  ],

  5: [
    "English",
    "Mathematics",
    "EVS",
    "Hindi",
    "Computer",
    "Art",
    "Physical Education"
  ],

  6: [
    "English",
    "Mathematics",
    "Science",
    "Social Studies",
    "Hindi",
    "Computer",
    "Physical Education"
  ],

  7: [
    "English",
    "Mathematics",
    "Science",
    "Social Studies",
    "Hindi",
    "Computer",
    "Physical Education"
  ],

  8: [
    "English",
    "Mathematics",
    "Science",
    "Social Studies",
    "Hindi",
    "Computer",
    "Physical Education"
  ],

  9: [
    "English",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Computer"
  ],

  10: [
    "English",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "History",
    "Geography",
    "Civics",
    "Computer"
  ],

  11: [
    "English",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "Accountancy",
    "Business Studies",
    "Political Science"
  ],

  12: [
    "English",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Economics",
    "Accountancy",
    "Business Studies",
    "Political Science"
  ]
};

export const getSubjectsForClass = (classNumber) => {
  return subjectsByClass[Number(classNumber)] || [];
};

export const allSubjects = [
  ...new Set(Object.values(subjectsByClass).flat())
];
