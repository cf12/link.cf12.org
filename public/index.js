const slugField = document.querySelector('.slug')

// slugField.addEventListener('input', (e) => {
//   e.preventDefault()
//   console.log(e)

//   return false
// })

slugField.addEventListener('keypress', (e) => {
  if (!e.key.match(/[0-9a-z-]/i)) {
    e.preventDefault()
  }
})