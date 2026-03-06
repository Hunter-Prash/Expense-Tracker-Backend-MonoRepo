import express from 'express'
import { createUser, deleteUser, getUser } from '../controllers/crud.js'

const router=express.Router()

router.post('createUser',createUser)
router.get('/login',getUser)
router.delete('/deleteUser',deleteUser)

export default router