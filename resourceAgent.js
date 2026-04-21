/**
 * Resource Agent
 * Prompt: "You are a resource allocation agent. Based on priority level,
 * suggest number of rescue teams, medical kits, and supplies required."
 */

const axios = require('axios')

const RESOURCE_PROMPT = (data) => `
You are a resource allocation agent for RescueAI disaster response system.
Disaster: ${data.disasterType} in ${data.location}
Severity: ${data.severity}/10
Priority Level: ${data.priorityLevel}
Available Teams in area: ${data.availableTeams || 'unknown'}

Provide resource allocation in this EXACT JSON format (no extra text):
{
  "teams": <number>,
  "medicalKits": <number>,
  "foodPacks": <number>,
  "helicopters": <number>,
  "ambulances": <number>,
  "waterTankers": <number>,
  "reasoning": "<one sentence>"
}
`.trim()

function calculateResources(severity, disasterType, priorityLevel, availableTeams) {
  const s = Number(severity)
  const multiplier = priorityLevel === 'HIGH' ? 1.5 : priorityLevel === 'MEDIUM' ? 1.0 : 0.6

  const base = {
    teams:       Math.ceil(s * 2 * multiplier),
    medicalKits: Math.ceil(s * 10 * multiplier),
    foodPacks:   Math.ceil(s * 50 * multiplier),
    helicopters: s >= 7 ? Math.ceil(s / 3) : 0,
    ambulances:  Math.ceil(s * 1.5 * multiplier),
    waterTankers: 0
  }

  // Disaster-type adjustments
  if (disasterType === 'Flood') {
    base.waterTankers = 0
    base.boats = Math.ceil(s / 2)
  }
  if (disasterType === 'Fire') {
    base.fireEngines = Math.ceil(s / 2)
    base.waterTankers = Math.ceil(s / 3)
  }
  if (disasterType === 'Earthquake') {
    base.teams = Math.ceil(base.teams * 1.3)
    base.medicalKits = Math.ceil(base.medicalKits * 1.5)
  }
  if (disasterType === 'Cyclone' || disasterType === 'Tsunami') {
    base.helicopters = Math.ceil(base.helicopters * 1.5) + 1
  }

  base.reasoning = `${priorityLevel} priority ${disasterType} requires ${base.teams} rescue teams and ${base.medicalKits} medical kits for severity ${s}/10.`
  return base
}

async function runResourceAgent(disasterData) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY

  if (OPENAI_KEY) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a resource allocation AI agent. Always respond with valid JSON only.'
            },
            { role: 'user', content: RESOURCE_PROMPT(disasterData) }
          ],
          max_tokens: 200,
          temperature: 0.1
        },
        { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
      )
      const text = response.data.choices[0].message.content.trim()
      const parsed = JSON.parse(text)
      return { agent: 'Resource Agent', ...parsed }
    } catch (err) {
      console.error('Resource Agent LLM error:', err.message)
    }
  }

  // Fallback
  const resources = calculateResources(
    disasterData.severity,
    disasterData.disasterType,
    disasterData.priorityLevel || 'MEDIUM',
    disasterData.availableTeams
  )
  return { agent: 'Resource Agent', ...resources }
}

module.exports = { runResourceAgent }
