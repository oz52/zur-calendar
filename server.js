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
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return res.json(JSON.parse(data || '[]'));
  } catch {
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

app.post('/appointments', (req, res) => {
  try {
    const newAppt = { id: Date.now(), ...req.body };
    const appts = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : [];
    appts.push(newAppt);
    fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
    res.status(201).json(newAppt);
  } catch {
    res.status(500).json({ error: 'Failed to save appointment' });
  }
});

app.put('/appointments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = req.body;
    let appts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    appts = appts.map(a => a.id === id ? { ...a, ...updated } : a);
    fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
    res.json({ id, ...updated });
  } catch {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

app.delete('/appointments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let appts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    appts = appts.filter(a => a.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

app.get('/export/ical', (req, res) => {
  try {
    const appts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
    appts.forEach(a => {
      const dt = a.date.replace(/-/g, '') + 'T' + a.time.replace(':', '') + '00';
      ics += `BEGIN:VEVENT\nUID:${a.id}@zur\nDTSTART:${dt}\nSUMMARY:${a.familyMember} with ${a.meetingWith}\nDESCRIPTION:${a.notes || ''}\nEND:VEVENT\n`;
    });
    ics += 'END:VCALENDAR';
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=zur-calendar.ics');
    res.send(ics.replace(/\n/g, '\r\n'));
  } catch {
    res.status(500).send("Failed to export");
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
