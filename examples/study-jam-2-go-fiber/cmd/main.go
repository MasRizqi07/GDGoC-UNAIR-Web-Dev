package main

import (
	"backend-series-2/routes"

	"github.com/gofiber/fiber/v2"

	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {

	app := fiber.New()

	app.Use(cors.New())

	routes.StudentRoutes(app)

	app.Get("/", func(c *fiber.Ctx) error {

		return c.JSON(fiber.Map{
			"message": "Backend Learning Series 2",
		})

	})

	app.Listen(":3000")
}