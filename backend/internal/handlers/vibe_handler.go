package handlers

import (
	"strconv"

	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/vibecheck/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type VibeHandler struct {
	service *services.VibeService
}

func NewVibeHandler(service *services.VibeService) *VibeHandler {
	return &VibeHandler{service: service}
}

// CreateVibeCheck handles POST /api/vibes
func (h *VibeHandler) CreateVibeCheck(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	var req dto.CreateVibeCheckRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid request body",
		})
	}

	check, err := h.service.CreateVibeCheck(userID, req.MoodText)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(check)
}

// GetTodayCheck handles GET /api/vibes/today
func (h *VibeHandler) GetTodayCheck(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	check, err := h.service.GetTodayCheck(userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   true,
			"message": "No vibe check today",
		})
	}

	return c.JSON(check)
}

// GetVibeHistory handles GET /api/vibes/history
func (h *VibeHandler) GetVibeHistory(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	if limit > 100 {
		limit = 100
	}

	checks, total, err := h.service.GetVibeHistory(userID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to fetch history",
		})
	}

	return c.JSON(fiber.Map{
		"data":   checks,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetVibeStats handles GET /api/vibes/stats
func (h *VibeHandler) GetVibeStats(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["sub"].(string))

	stats, err := h.service.GetVibeStats(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to fetch stats",
		})
	}

	return c.JSON(stats)
}
