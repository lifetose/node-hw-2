const express = require('express')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { body, validationResult } = require('express-validator')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const usersFilePath = path.join(__dirname, 'users.json')

function readUsersFromFile() {
  const usersData = fs.readFileSync(usersFilePath, 'utf8')
  return JSON.parse(usersData)
}

function writeUsersToFile(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
}

const validateUser = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .notEmpty()
    .withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
]

app.post('/users', validateUser, (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, email, password } = req.body

    const users = readUsersFromFile()
    const id = uuidv4()
    const newUser = { id, name, email, password }
    users.push(newUser)

    writeUsersToFile(users)
    res.status(201).send(newUser)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.put('/users/:userId', validateUser, (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const userId = req.params.userId

    const users = readUsersFromFile()

    const userIndex = users.findIndex((user) => user.id === userId)
    if (userIndex === -1) {
      return res.status(404).send('User not found')
    }
    console.log(req.body)

    const { name, email, password } = req.body
    users[userIndex].name = name
    users[userIndex].email = email
    users[userIndex].password = password

    writeUsersToFile(users)
    res.status(201).send(users[userIndex])
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.get('/users', (req, res) => {
  try {
    const users = readUsersFromFile()
    res.send(users)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.get('/users/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const users = readUsersFromFile()
    const user = users.find((user) => user.id === userId)
    if (!user) {
      return res.status(404).send('User not found')
    }
    res.send(user)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.delete('/users/:userId', (req, res) => {
  try {
    const userId = req.params.userId
    const users = readUsersFromFile()
    const userIndex = users.findIndex((user) => user.id === userId)
    if (userIndex === -1) {
      return res.status(404).send('User not found')
    }
    users.splice(userIndex, 1)

    writeUsersToFile(users)
    res.sendStatus(204)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
