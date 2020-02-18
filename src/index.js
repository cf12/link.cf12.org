const fs = require('fs')
const path = require('path')
const express = require('express')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')


const dataDir = path.resolve(__dirname, '..', 'data')
if (!fs.existsSync(dataDir))
  fs.mkdirSync(dataDir)


const PORT = process.env.PORT || 8080
const app = express()

const adapter = new FileSync(path.join(dataDir, 'links.json'))
const db = low(adapter)

db.defaults({ links: {} })
  .write()



app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.end('Hello world!')
})

app.get('/:slug', (req, res) => {
  const url = db
    .get('links')
    .get(req.params.slug)
    .value()
  console.log(req.params)


  if (url)
    res.redirect(url)
  else
    res.json({ error: 'Invalid link!' })
})

app.post('/', (req, res) => {
  console.log(req.body)
  const { slug, url } = req.body

  // TODO: Verify slug
  // TODO: 404 detection
  // TODO: Security concerns: javascript:, & other potentially unwanted URLs

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
