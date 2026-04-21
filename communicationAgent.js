/**
 * Communication Agent
 * Prompt: "You are a communication agent. Generate a clear alert message
 * for responders based on the disaster situation."
 */

const axios = require('axios')

const COMM_PROMPT = (data) => `
You are a communication agent for RescueAI emergency response system.
Generate TWO outputs for this disaster:

Disaster: ${data.disasterType}
Location: ${data.location}
Severity: ${data.severity}/10
Priority: ${data.priorityLevel}
Resources deployed: ${data.teams} teams, ${data.medicalKits} medical kits

Respond in this EXACT JSON format (no extra text):
{
  "alertMessage": "<urgent 1-sentence public alert>",
  "responderBrief": "<2-sentence technical brief for rescue teams>",
  "evacuationOrder": <true or false>
}
`.trim()

function generateFallbackComms(data) {
  const s = Number(data.severity)
  const level = data.priorityLevel || (s >= 8 ? 'HIGH' : s >= 5 ? 'MEDIUM' : 'LOW')
  const evacuate = s >= 7

  const alerts = {
    HIGH:   `🚨 CRITICAL ALERT: ${data.disasterType.toUpperCase()} emergency in ${data.location} — Severity ${s}/10. Immediate evacuation required. All residents move to designated shelters NOW.`,
    MEDIUM: `⚠️ ALERT: ${data.disasterType} reported in ${data.location} — Severity ${s}/10. Stay alert and follow official instructions. Rescue teams are being deployed.`,
    LOW:    `ℹ️ NOTICE: ${data.disasterType} activity detected in ${data.location} — Severity ${s}/10. Situation is being monitored. No immediate action required.`
  }

  const briefs = {
    HIGH:   `PRIORITY RESPONSE: Deploy ${data.teams || 'all available'} rescue teams to ${data.location} immediately. Establish command post, begin search & rescue operations, and set up medical triage stations.`,
    MEDIUM: `STANDARD RESPONSE: Dispatch ${data.teams || 'assigned'} rescue teams to ${data.location}. Assess damage, provide medical assistance, and report status every 30 minutes.`,
    LOW:    `MONITORING RESPONSE: Send assessment team to ${data.location}. Document damage, assist affected residents, and report findings to command center.`
  }

  return {
    alertMessage: alerts[level],
    responderBrief: briefs[level],
    evacuationOrder: evacuate
  }
}

async function runCommunicationAgent(disasterData) {
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
              content: 'You are an emergency communication AI agent. Always respond with valid JSON only.'
            },
            { role: 'user', content: COMM_PROMPT(disasterData) }
          ],
          max_tokens: 250,
          temperature: 0.2
        },
        { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
      )
      const text = response.data.choices[0].message.content.trim()
      const parsed = JSON.parse(text)
      return { agent: 'Communication Agent', ...parsed }
    } catch (err) {
      console.error('Communication Agent LLM error:', err.message)
    }
  }

  // Fallback
  const comms = generateFallbackComms(disasterData)
  return { agent: 'Communication Agent', ...comms }
}

module.exports = { runCommunicationAgent }
