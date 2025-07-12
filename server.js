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

// Get all appointments
app.get('/appointments', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return res.json(JSON.parse(data || '[]'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// Add appointment
app.post('/appointments', (req, res) => {
  try {
    const newAppt = { id: Date.now(), ...req.body };
    let appts = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]') : [];

    const conflict = appts.find(a =>
      a.date === newAppt.date &&
      a.time === newAppt.time &&
      a.familyMember === newAppt.familyMember &&
      a.id !== newAppt.id
    );

    if (conflict) {
      return res.status(409).json({ conflict: true, message: 'Conflict detected.', conflictDetails: conflict });
    }

    appts.push(newAppt);
    fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
    return res.status(201).json(newAppt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save appointment' });
  }
});

// Delete appointment
app.delete('/appointments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let appts = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]') : [];
    appts = appts.filter(a => a.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// Edit appointment
app.put('/appointments/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = req.body;
    let appts = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]') : [];
    appts = appts.map(a => a.id === id ? { ...a, ...updated } : a);
    fs.writeFileSync(DATA_FILE, JSON.stringify(appts, null, 2));
    res.json({ id, ...updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Export to ICS
app.get('/export/ical', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.status(404).send("No data.");
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\n";
    data.forEach((a) => {
      const dt = a.date.replace(/-/g, "") + "T" + a.time.replace(":", "") + "00";
      icsContent += `BEGIN:VEVENT\nUID:${a.id}@zurcalendar\nDTSTART:${dt}\nSUMMARY:${a.familyMember} with ${a.meetingWith}\nDESCRIPTION:${a.notes || ''}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", "attachment; filename=zur-calendar.ics");
    res.send(icsContent.replace(/\n/g, '\r\n'));
  } catch (err) {
    res.status(500).send("Failed to export.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
