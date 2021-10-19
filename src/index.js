const express = require('express')
const rateLimit = require("express-rate-limit")
const Redis = require('ioredis')
const helmet = require('helmet')
const path = require('path')

const stealthKeywords = require('./keywords.json')

// Redis
const client = new Redis('redis')

// Express + middleware
const PORT = 8080
const app = express()

app.use(helmet())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.resolve(__dirname, '..', 'public')))

// Rate limiting: 500 req / 10 min
app.set('trust proxy', 1)
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500
}))

app.get('/:slug', async (req, res) => {
  const ua = req.header("User-Agent")
  let stealthRequest = stealthKeywords.some(e => ua.toLowerCase().includes(e))

  try {
    const url = await client.hget(req.params.slug, 'url')
    const stealth = await client.hget(req.params.slug, 'stealth')

    if (url)
      if (stealthRequest && stealth) res.redirect(stealth)
      else res.redirect(url)
    else
      res.json({ error: 'Invalid link!' })
  } catch (err) {
    throw new Error(err)
  }
})

app.post('/', async (req, res) => {
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

  try {
    if (await client.exists(slug)) {
      res.json({
        error: 'URL already exists!'
      })
      return
    }

    client.hset(slug, 'url', url)
    client.hset(slug, 'stealth', stealth)

    res.json({
      info: 'URL created successfully!',
      source: url,
      slug: slug
    })
  } catch (err) {
    throw new Error(err)
  }
})

console.log(`[i] Server listening on port: ${PORT}`)
app.listen(PORT)
