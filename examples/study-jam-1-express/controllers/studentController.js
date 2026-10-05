const students = require("../data/students");

const getAllStudents = (req, res) => {
  res.json(students);
};

const getStudentById = (req, res) => {

  const id = Number(req.params.id);

  const student = students.find(
    s => s.id === id
  );

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  res.json(student);
};

const createStudent = (req, res) => {

  const { name, major } = req.body;

  const newStudent = {
    id: students.length + 1,
    name,
    major
  };

  students.push(newStudent);

  res.status(201).json({
    message: "Student created",
    data: newStudent
  });

};

const updateStudent = (req, res) => {

  const id = Number(req.params.id);

  const student = students.find(
    s => s.id === id
  );

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  student.name = req.body.name;
  student.major = req.body.major;

  res.json({
    message: "Student updated",
    data: student
  });

};

const deleteStudent = (req, res) => {

  const id = Number(req.params.id);

  const index = students.findIndex(
    s => s.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  students.splice(index, 1);

  res.json({
    message: "Student deleted"
  });

};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};