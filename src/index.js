const express = require('express')
const rateLimit = require("express-rate-limit")
const helmet = require('helmet')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const fs = require('fs-extra')
const path = require('path')

// Database
const dataDir = path.resolve(__dirname, '..', 'data')
fs.ensureDirSync(dataDir)

const adapter = new FileSync(path.join(dataDir, 'links.json'))
const db = low(adapter)

db.defaults({ links: {} })
  .write()

// Express + middleware
const PORT = process.env.PORT || 8080
const app = express()

const stealthKeywords = [
  "Discord"
]

app.use(helmet())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.resolve(__dirname, '..', 'public')))

// Rate limiting: 500 req / 10 min
app.set('trust proxy', 1)
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500
}))

app.get('/:slug', (req, res) => {
  const ua = req.header("User-Agent")
  let stealthRequest = false

  for (const keyword of stealthKeywords) {
    if (ua.includes(keyword)) stealthRequest = true
  }

  const link = db
    .get('links')
    .get(req.params.slug)
    .value()

  if (link)
    if (stealthRequest) res.redirect(link.stealth)
    else res.redirect(link.url)
  else
    res.json({ error: 'Invalid link!' })
})

app.post('/', (req, res) => {
  const urlRegex = /^(?:(?:(?:http[s]?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
  const slugRegex = /[0-9a-z-]/i
  let { slug, url, stealth } = req.body

  url = url.trim()
  slug = slug.trim()
  stealth = stealth.trim()

  // TODO: 404 detection
  if (!url.match(urlRegex) || !slug.match(slugRegex)) {
    res.json({
      error: 'Invalid URL / Slug'
    })
    return
  }

  db.get('links')
    .set(slug, {
      url,
      stealth
    })
    .write()

  res.json({
    info: 'URL created successfully!',
    url: url,
    slug: slug
  })
})

console.log(`[i] Server listening on port: ${PORT}`)
app.listen(PORT)
