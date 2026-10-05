package routes

import (
	"backend-series-2/internal/handler"

	"github.com/gofiber/fiber/v2"
)

func StudentRoutes(
	app *fiber.App,
) {

	api :=
		app.Group("/api")

	api.Get(
		"/students",
		handler.GetStudents,
	)

	api.Get(
		"/students/:id",
		handler.GetStudent,
	)

	api.Post(
		"/students",
		handler.CreateStudent,
	)

}