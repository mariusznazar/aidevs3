import { Router } from 'express'
import { handleQuestion, handleLogin, handleLLM, handleVerify, handleTranscribe, handleImageAnalysis, handleRobotId, handleImageGeneration } from '../controllers/proxy.js'
import axios from 'axios'

const router = Router()

router.get('/question', handleQuestion)
router.post('/login', handleLogin)
router.post('/llm', handleLLM)
router.post('/verify', handleVerify)
router.post('/transcribe', handleTranscribe)
router.post('/analyze-image', handleImageAnalysis)
router.get('/robotid', handleRobotId)
router.post('/generate-image', handleImageGeneration)

export default router 