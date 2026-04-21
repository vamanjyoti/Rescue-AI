import { useState } from 'react'
import MapSection from './MapSection'
import ZonesTable from './ZonesTable'

const LOADING_STEPS = [
  '📊 Running Python analytics on 6000 zones...',
  '🧠 Planning Agent identifying priority areas...',
  '📦 Resource Agent allocating supplies...',
  '📡 Communication Agent generating alerts...',
  '🗺️  Fetching route data...',
]

export default function ResultsDashboard({ results, loading }) {
  if (loading) {
    return (
      <div className="results-panel">
        <div className="loading">
          <div className="spinner" />
          <span>Processing with AI Agents</span>
          <div className="loading-steps">
            {LOADING_STEPS.map((s, i) => (
              <div key={i} className={`loading-step ${i === 0 ? 'active' : ''}`}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="results-panel">
        <div className="empty-state">
          <span className="icon">🛰️</span>
          <p>Enter disaster details and click Analyze</p>
          <p style={{ fontSize: '0.78rem', color: '#334155' }}>
            Powered by 3 AI Agents + Python Analytics + 6000-zone dataset
          </p>
        </div>
      </div>
    )
  }

  const { priority, resources, explanation, alerts, route, topZones, form } = results
  const level = priority?.level || 'MEDIUM'

  return (
    <div className="results-panel">
      {/* Row 1: Priority + Resources + Alerts */}
      <div className="top-row">
        <PriorityCard priority={priority} level={level} />
        <ResourceCard resources={resources} />
        <AlertCard alerts={alerts} />
      </div>

      {/* Row 2: AI Explanation */}
      <ExplanationCard explanation={explanation} />

      {/* Row 3: Top Zones Table */}
      {topZones?.length > 0 && <ZonesTable zones={topZones} city={form.location} />}

      {/* Row 4: Map */}
      <MapSection route={route} location={form.location} />
    </div>
  )
}

// ── Priority Card ─────────────────────────────────────────────────────────────
function PriorityCard({ priority, level }) {
  return (
    <div className="card">
      <div className="card-label">🎯 Priority Level</div>
      <div className="priority-value">
        <span className={`priority-badge priority-${level}`}>{level}</span>
      </div>
      <div className="priority-score">Score: {priority?.score ?? '—'} / 10</div>
      {priority?.avg_population_density && (
        <div className="priority-meta">
          <div>👥 Avg Pop Density: {priority.avg_population_density}/km²</div>
          <div>📍 Avg Distance: {priority.avg_distance_km} km</div>
          <div>🌦️ Weather Risk: {priority.avg_weather_risk}/10</div>
        </div>
      )}
      {priority?.data_source && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#475569' }}>
          Source: {priority.data_source === 'dataset' ? '📊 Real Dataset' : '⚡ Calculated'}
        </div>
      )}
    </div>
  )
}

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ resources }) {
  if (!resources) return <div className="card"><div className="card-label">📦 Resources</div><div style={{ color: '#475569' }}>—</div></div>
  return (
    <div className="card">
      <div className="card-label">📦 Resources Required</div>
      <ul className="resource-list">
        <li><span>🚒 Rescue Teams</span><span>{resources.teams}</span></li>
        <li><span>🏥 Medical Kits</span><span>{resources.medicalKits}</span></li>
        <li><span>🍱 Food Packs</span><span>{resources.foodPacks}</span></li>
        <li><span>💧 Water Units</span><span>{resources.waterUnits}</span></li>
        <li><span>🚁 Helicopters</span><span>{resources.helicopters}</span></li>
        <li><span>🚑 Ambulances</span><span>{resources.ambulances}</span></li>
      </ul>
      {resources.specialEquipment?.length > 0 && (
        <div className="equip-tags">
          {resources.specialEquipment.map(e => <span key={e} className="equip-tag">{e}</span>)}
        </div>
      )}
      {resources.estimatedCost && (
        <div className="resource-extra">Est. Cost: {resources.estimatedCost}</div>
      )}
      {resources.additionalTeamsNeeded > 0 && (
        <div className="resource-extra" style={{ color: '#f87171' }}>
          ⚠️ {resources.additionalTeamsNeeded} additional teams needed
        </div>
      )}
    </div>
  )
}

// ── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({ alerts }) {
  const tabs = [
    { key: 'responder', label: '🚒 Responder' },
    { key: 'authority', label: '🏛️ Authority' },
    { key: 'public',    label: '📢 Public' },
  ]
  const [tab, setTab] = useState('responder')

  if (!alerts) return <div className="card"><div className="card-label">📡 Alerts</div><div style={{ color: '#475569' }}>—</div></div>

  return (
    <div className="card">
      <div className="card-label">📡 Communication Agent</div>
      <div className="alert-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`alert-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="alert-message">{alerts[tab] || '—'}</div>
    </div>
  )
}

// ── Explanation Card ──────────────────────────────────────────────────────────
function ExplanationCard({ explanation }) {
  if (!explanation) return null
  return (
    <div className="card">
      <div className="ai-badge">🤖 Planning Agent — AI Explanation</div>
      <p className="explanation-text">{explanation.text || explanation}</p>
    </div>
  )
}
