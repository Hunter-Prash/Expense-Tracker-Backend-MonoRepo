import express from 'express'
import { getStatus, workLogger } from '../controllers/workController.js';

const router=express.Router()


router.get('/status',getStatus)
router.post('/log-work',workLogger)


export default router;