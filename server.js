require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const mongoose  = require('mongoose')
const routes    = require('./routes/disaster')

const app  = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: '*' }))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})
app.use(express.json())
app.use('/api', routes)
app.get('/health', (_, res) => res.json({ status: 'ok', port: PORT }))

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rescueai')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(e  => console.warn('⚠️  MongoDB not connected:', e.message))

app.listen(PORT, () =>
  console.log(`🚀 RescueAI Backend → http://localhost:${PORT}`)
)
