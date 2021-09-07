const jsonwebtoken = require('jsonwebtoken');
const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User },
} = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/users/:id/notes', async (req, res, next) => {
  try {
    const loggedIn = await User.byToken(req.headers.authorization);
    if (loggedIn.id === req.params.id) {
      const user = await User.findByPk(req.params.id);
      const userNotes = await user.getNotes();
      res.status(200).send(userNotes);
    }
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
