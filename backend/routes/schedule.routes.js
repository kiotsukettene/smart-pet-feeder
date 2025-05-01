import express from 'express';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule } from '../controllers/schedule.controller.js';

const router = express.Router();

router.get('/', getAllSchedules);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;