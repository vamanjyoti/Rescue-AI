const express = require('express')
const axios   = require('axios')
const Disaster = require('../models/Disaster')
const { runPlanningAgent }       = require('../agents/planningAgent')
const { runResourceAgent }       = require('../agents/resourceAgent')
const { runCommunicationAgent }  = require('../agents/communicationAgent')

const router   = express.Router()
const PYTHON   = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
const GMAPS    = process.env.GOOGLE_MAPS_KEY    || ''

// ── POST /api/addDisaster ─────────────────────────────────────────────────────
router.post('/addDisaster', async (req, res) => {
  try {
    const { disasterType, location, severity } = req.body
    const doc = new Disaster({ disasterType, location, severity })
    await doc.save()
    res.json({ success: true, id: doc._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/getPriority ─────────────────────────────────────────────────────
router.post('/getPriority', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON}/priority`, req.body, { timeout: 5000 })
    res.json(response.data)
  } catch {
    // Local fallback
    const s = Number(req.body.severity)
    const score = parseFloat((
      0.4 * s +
      0.3 * Math.min((Number(req.body.populationDensity || 60) / 100) * 10, 10) +
      0.2 * Math.min((Number(req.body.distance || 25) / 50) * 10, 10) +
      0.1 * Number(req.body.weatherRisk || 5)
    ).toFixed(2))
    const level = score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW'
    res.json({ level, score })
  }
})

// ── POST /api/getResources ────────────────────────────────────────────────────
router.post('/getResources', async (req, res) => {
  try {
    const { disasterType, location, severity, priorityLevel, availableTeams } = req.body
    const result = await runResourceAgent({ disasterType, location, severity, priorityLevel, availableTeams })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/getRoute ────────────────────────────────────────────────────────
router.post('/getRoute', async (req, res) => {
  try {
    const { location } = req.body
    if (!GMAPS) {
      return res.json({
        origin: 'Rescue Headquarters',
        destination: location,
        distance: 'N/A (add GOOGLE_MAPS_KEY)',
        duration: 'N/A'
      })
    }
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=Rescue+Headquarters&destination=${encodeURIComponent(location)}&key=${GMAPS}`
    const r = await axios.get(url)
    if (r.data.routes.length > 0) {
      const leg = r.data.routes[0].legs[0]
      res.json({
        origin: leg.start_address,
        destination: leg.end_address,
        distance: leg.distance.text,
        duration: leg.duration.text
      })
    } else {
      res.json({ origin: 'Rescue HQ', destination: location, distance: 'N/A', duration: 'N/A' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/getExplanation ──────────────────────────────────────────────────
// Runs all 3 agents and returns combined output
router.post('/getExplanation', async (req, res) => {
  try {
    const { disasterType, location, severity, priorityLevel, teams, medicalKits } = req.body

    const agentData = { disasterType, location, severity, priorityLevel, teams, medicalKits }

    // Run Planning Agent + Communication Agent in parallel
    const [planning, comms] = await Promise.all([
      runPlanningAgent(agentData),
      runCommunicationAgent(agentData)
    ])

    res.json({
      text:            planning.output,
      alertMessage:    comms.alertMessage,
      responderBrief:  comms.responderBrief,
      evacuationOrder: comms.evacuationOrder,
      agents: {
        planning:      planning.agent,
        communication: comms.agent
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/analyze ─────────────────────────────────────────────────────────
// Full pipeline: priority → resources → explanation in one call
router.post('/analyze', async (req, res) => {
  try {
    const { disasterType, location, severity } = req.body

    // Step 1: Get priority from Python analytics
    let priorityData = { level: 'MEDIUM', score: 5 }
    try {
      const pr = await axios.post(`${PYTHON}/priority`, req.body, { timeout: 5000 })
      priorityData = pr.data
    } catch { /* use fallback */ }

    const agentInput = { ...req.body, priorityLevel: priorityData.level }

    // Step 2: Run all 3 agents in parallel
    const [resources, planning, comms] = await Promise.all([
      runResourceAgent(agentInput),
      runPlanningAgent(agentInput),
      runCommunicationAgent({ ...agentInput, teams: null, medicalKits: null })
    ])

    // Step 3: Save to DB with full data
    try {
      const doc = new Disaster({
        disasterType, location, severity,
        priorityLevel: priorityData.level,
        priorityScore: priorityData.score,
        teams: resources.teams,
        medicalKits: resources.medicalKits,
        alertMessage: comms.alertMessage
      })
      await doc.save()
    } catch { /* DB optional */ }

    res.json({
      priority:   priorityData,
      resources,
      explanation: {
        text:            planning.output,
        alertMessage:    comms.alertMessage,
        responderBrief:  comms.responderBrief,
        evacuationOrder: comms.evacuationOrder
      },
      agents: ['Planning Agent', 'Resource Agent', 'Communication Agent']
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/zones ────────────────────────────────────────────────────────────
// Proxy to Python analytics for zone data
router.get('/zones', async (req, res) => {
  try {
    const city = req.query.city || ''
    const url  = city ? `${PYTHON}/zones?city=${city}` : `${PYTHON}/zones`
    const r    = await axios.get(url, { timeout: 5000 })
    res.json(r.data)
  } catch (err) {
    res.status(500).json({ error: 'Analytics service unavailable' })
  }
})

// ── GET /api/city-summary ─────────────────────────────────────────────────────
router.get('/city-summary', async (req, res) => {
  try {
    const r = await axios.get(`${PYTHON}/city-summary`, { timeout: 5000 })
    res.json(r.data)
  } catch (err) {
    res.status(500).json({ error: 'Analytics service unavailable' })
  }
})

// ── GET /api/history ──────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const records = await Disaster.find().sort({ createdAt: -1 }).limit(20)
    res.json(records)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
