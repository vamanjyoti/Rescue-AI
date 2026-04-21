/**
 * Planning Agent
 * Prompt: "You are a disaster management planning agent. Based on disaster severity,
 * population density, and location, identify the highest priority area and explain why."
 */

const axios = require('axios')

const PLANNING_PROMPT = (data) => `
You are a disaster management planning agent for RescueAI.
A ${data.disasterType} disaster has occurred in ${data.location} with severity ${data.severity}/10.
Population density index: ${data.populationDensity || 'unknown'}.
Distance from rescue center: ${data.distance || 'unknown'} km.
Weather risk: ${data.weatherRisk || 'unknown'}/10.

Based on this data, in 2-3 sentences:
1. State the priority level (HIGH/MEDIUM/LOW) and why
2. Identify what makes this area critical
3. Recommend immediate planning actions

Be concise, professional, and data-driven.
`.trim()

async function runPlanningAgent(disasterData) {
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
              content: 'You are a disaster management planning AI agent. Provide structured, actionable analysis.'
            },
            { role: 'user', content: PLANNING_PROMPT(disasterData) }
          ],
          max_tokens: 200,
          temperature: 0.3
        },
        { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
      )
      return {
        agent: 'Planning Agent',
        output: response.data.choices[0].message.content.trim()
      }
    } catch (err) {
      console.error('Planning Agent LLM error:', err.message)
    }
  }

  // Fallback without LLM
  const s = Number(disasterData.severity)
  const level = s >= 8 ? 'HIGH' : s >= 5 ? 'MEDIUM' : 'LOW'
  const reasons = []
  if (s >= 8) reasons.push('extreme disaster severity')
  if ((disasterData.populationDensity || 0) > 70) reasons.push('high population density')
  if ((disasterData.distance || 0) > 30) reasons.push('significant distance from rescue center')

  return {
    agent: 'Planning Agent',
    output: `${disasterData.location} is classified as ${level} priority due to ${
      reasons.length ? reasons.join(', ') : 'current disaster conditions'
    }. A ${disasterData.disasterType} with severity ${s}/10 requires ${
      level === 'HIGH' ? 'immediate' : level === 'MEDIUM' ? 'urgent' : 'standard'
    } deployment of rescue teams. Coordinate with local authorities and pre-position resources at nearest staging area.`
  }
}

module.exports = { runPlanningAgent }
