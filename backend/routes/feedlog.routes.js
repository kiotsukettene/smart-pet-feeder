import express from 'express';
import { getAllFeedLogs, createFeedLog } from '../controllers/feedlog.controller.js';

const router = express.Router();

router.get('/', getAllFeedLogs);
router.post('/', createFeedLog);

export default router;