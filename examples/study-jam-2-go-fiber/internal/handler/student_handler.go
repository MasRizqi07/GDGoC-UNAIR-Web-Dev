package handler

import (
	"strconv"

	"backend-series-2/internal/model"
	service "backend-series-2/internal/services"

	"github.com/gofiber/fiber/v2"
)

func GetStudents(c *fiber.Ctx) error {

	return c.JSON(
		service.GetAllStudents(),
	)

}

func GetStudent(c *fiber.Ctx) error {

	id, _ :=
		strconv.Atoi(
			c.Params("id"),
		)

	student :=
		service.GetStudentByID(id)

	if student == nil {

		return c.Status(404).JSON(
			fiber.Map{
				"message": "student not found",
			},
		)

	}

	return c.JSON(student)
}

func CreateStudent(c *fiber.Ctx) error {

	var student model.Student

	if err :=
		c.BodyParser(&student); err != nil {

		return c.Status(400).JSON(
			fiber.Map{
				"message": "invalid request",
			},
		)

	}

	service.CreateStudent(student)

	return c.Status(201).JSON(
		fiber.Map{
			"message": "student created",
			"data":    student,
		},
	)

}