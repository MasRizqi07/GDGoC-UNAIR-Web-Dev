const express = require("express");

const app = express();

app.use(express.json());

const students = [
  {
    id: 1,
    name: "Rizqi",
    major: "Teknik Informatika"
  }
];

app.get("/", (req, res) => {
  res.send("Backend Learning Series");
});

app.get("/students", (req, res) => {
  res.json(students);
});

app.post("/students", (req, res) => {

  const newStudent = {
    id: students.length + 1,
    name: req.body.name,
    major: req.body.major
  };

  students.push(newStudent);

  res.status(201).json({
    message: "Student added",
    data: newStudent
  });

});

app.put("/students/:id", (req, res) => {

  const id = Number(req.params.id);

  const student = students.find(
    s => s.id === id
  );

  if (!student) {
    return res
      .status(404)
      .json({
        message: "Student not found"
      });
  }

  student.name = req.body.name;
  student.major = req.body.major;

  res.json(student);

});

app.delete("/students/:id", (req, res) => {

  const id = Number(req.params.id);

  const index = students.findIndex(
    s => s.id === id
  );

  if (index === -1) {

    return res
      .status(404)
      .json({
        message: "Student not found"
      });

  }

  students.splice(index, 1);

  res.json({
    message: "Student deleted"
  });

});

app.listen(3000, () => {
  console.log(
    "Server running at http://localhost:3000"
  );
});