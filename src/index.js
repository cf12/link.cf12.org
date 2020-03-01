const fs = require('fs')
const path = require('path')
const express = require('express')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const helmet = require('helmet')

const dataDir = path.resolve(__dirname, '..', 'data')
if (!fs.existsSync(dataDir))
  fs.mkdirSync(dataDir)

const PORT = process.env.PORT || 8080
const app = express()

const adapter = new FileSync(path.join(dataDir, 'links.json'))
const db = low(adapter)

db.defaults({ links: {} })
  .write()

app.use(helmet())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.resolve(__dirname, '..', 'public')))

app.get('/:slug', (req, res) => {
  const url = db
    .get('links')
    .get(req.params.slug)
    .value()

  if (url)
    res.redirect(url)
  else
    res.json({ error: 'Invalid link!' })
})

app.post('/', (req, res) => {
  const urlRegex = /^(?:(?:(?:http[s]?):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
  const slugRegex = /^[a-z\d](?:[a-z\d_-]*[a-z\d])?$/i
  let { slug, url } = req.body

  url = url.trim()
  slug = slug.trim()

  // TODO: 404 detection

  if (!url.match(urlRegex) || !slug.match(slugRegex)) {
    res.json({
      error: 'Invalid URL / Slug'
    })
    return
  }

  db.get('links')
    .set(slug, url)
    .write()

  res.json({
    info: 'URL created successfully!',
    url: url,
    slug: slug
  })
})



console.log(`[i] Server listening on port: ${PORT}`)
app.listen(PORT)
