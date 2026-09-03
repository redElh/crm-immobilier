import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import {
  getVacancesProperties,
  getVacancesReservations,
  putVacancesReservations,
  toggleVacancesDate,
} from '../controllers/toolbox.controller.js'

const router = express.Router()

// All toolbox routes require auth
router.get('/vacances/properties', verifyToken, getVacancesProperties)
router.get('/vacances/:apimoPropertyId/reservations', verifyToken, getVacancesReservations)
router.put('/vacances/:apimoPropertyId/reservations', verifyToken, putVacancesReservations)
router.post('/vacances/:apimoPropertyId/toggle', verifyToken, toggleVacancesDate)

export default router
