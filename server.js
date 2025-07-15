const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'appointments.json');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/appointments', (req, res) => {
  const data = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : "[]";
  res.json(JSON.parse(data));
});
app.post('/appointments', (req, res) => {
  const newAppt = { id: Date.now(), ...req.body };
  const appts = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
  appts.push(newAppt);
  fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
  res.status(201).json(newAppt);
});
app.delete('/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const appts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || "[]");
  const updated = appts.filter(a => a.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));
  res.status(204).end();
});
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));