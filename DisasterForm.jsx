import { useState } from 'react'
import axios from 'axios'

const DISASTER_TYPES = ['Flood', 'Fire', 'Earthquake', 'Cyclone', 'Landslide', 'Tsunami']
const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']

export default function DisasterForm({ setResults, setLoading, loading }) {
  const [form, setForm]   = useState({ disasterType: 'Flood', location: '', severity: 5 })
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.location.trim()) { setError('Please enter a location.'); return }
    setError(''); setLoading(true); setResults(null)

    try {
      const res = await axios.post('/api/analyze', form)
      setResults({ ...res.data, form })
    } catch (err) {
      setError(err.response?.data?.error || 'Backend not reachable. Make sure server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="input-panel">
      <div className="panel-title">⚡ Disaster Input</div>
      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="disasterType">Disaster Type</label>
          <select id="disasterType" name="disasterType" value={form.disasterType} onChange={handleChange}>
            {DISASTER_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location / City</label>
          <input
            id="location" type="text" name="location"
            placeholder="e.g. Mumbai, Delhi, Kolkata..."
            value={form.location} onChange={handleChange}
            list="city-suggestions"
          />
          <datalist id="city-suggestions">
            {CITIES.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="form-group">
          <label htmlFor="severity">Severity Level</label>
          <div className="severity-row">
            <input
              id="severity" type="range" name="severity"
              min="1" max="10" value={form.severity} onChange={handleChange}
            />
            <span className="severity-badge">{form.severity}</span>
          </div>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <button type="submit" className="analyze-btn" disabled={loading}>
          {loading ? '⏳ Analyzing...' : '🔍 Analyze Disaster'}
        </button>
      </form>

      {/* Info box */}
      <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#0f172a', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
        <div style={{ color: '#f97316', marginBottom: '0.4rem', fontWeight: 600 }}>How it works</div>
        <div>📊 Python analytics calculates priority score using real dataset of 6000 zones</div>
        <div style={{ marginTop: '0.3rem' }}>🤖 3 AI agents handle planning, resources & communication</div>
        <div style={{ marginTop: '0.3rem' }}>💾 Results saved to MongoDB</div>
      </div>
    </div>
  )
}
