package service

import (
	"backend-series-2/internal/model"
	"backend-series-2/internal/repository"
)

func GetAllStudents() []model.Student {
	return repository.Students
}

func GetStudentByID(id int) *model.Student {

	for _, student := range repository.Students {

		if student.ID == id {
			return &student
		}

	}

	return nil
}

func CreateStudent(student model.Student) {

	repository.Students =
		append(
			repository.Students,
			student,
		)

}