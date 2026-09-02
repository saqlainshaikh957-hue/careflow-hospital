const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

let patients = [
  { id: 1, name: 'Amina Yusuf', age: 29, doctor: 'Dr. Ada Okafor', status: 'Stable' },
  { id: 2, name: 'Tunde Bello', age: 41, doctor: 'Dr. Michael Chen', status: 'Pending Review' }
];

let appointments = [
  { id: 1, patientName: 'Amina Yusuf', date: '2026-08-02', doctor: 'Dr. Ada Okafor', status: 'Confirmed' },
  { id: 2, patientName: 'Tunde Bello', date: '2026-08-05', doctor: 'Dr. Michael Chen', status: 'Pending' }
];

let doctors = [
  { id: 1, name: 'Dr. Ada Okafor', specialty: 'General Medicine', active: true, presentToday: true },
  { id: 2, name: 'Dr. Michael Chen', specialty: 'Cardiology', active: false, presentToday: false },
  { id: 3, name: 'Dr. Sara Ibrahim', specialty: 'Pediatrics', active: true, presentToday: true }
];

let staff = [
  { id: 1, name: 'Sarah Johnson', role: 'Nurse', department: 'Emergency', presentToday: true, active: true },
  { id: 2, name: 'Daniel Green', role: 'Receptionist', department: 'Front Desk', presentToday: false, active: false }
];

let patientRecords = [
  { id: 1, patientName: 'Amina Yusuf', note: 'Routine check-up completed', date: '2026-08-01' },
  { id: 2, patientName: 'Tunde Bello', note: 'Follow-up consultation scheduled', date: '2026-08-02' }
];

let contactMessages = [];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

async function sendContactEmail(payload) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, message: 'Email credentials not configured.' };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      subject: `New contact message from ${payload.name}`,
      text: `Name: ${payload.name}\nEmail: ${payload.email}\n\nMessage:\n${payload.message}`
    });
    return { success: true, message: 'Email sent.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch {
      callback({});
    }
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/overview') {
    sendJson(res, 200, {
      success: true,
      message: 'Hospital overview loaded successfully',
      data: {
        patients: patients.length,
        appointments: appointments.length,
        doctors: doctors.length
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/patients') {
    sendJson(res, 200, { success: true, data: patients });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/patients') {
    parseBody(req, body => {
      const { name, age, doctor, status } = body;
      if (!name || !age || !doctor) {
        sendJson(res, 400, { success: false, message: 'Name, age and doctor are required.' });
        return;
      }
      const patient = { id: Date.now(), name, age: Number(age), doctor, status: status || 'Registered' };
      patients.push(patient);
      sendJson(res, 201, { success: true, message: 'Patient registered successfully', data: patient });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/appointments') {
    sendJson(res, 200, { success: true, data: appointments });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/appointments') {
    parseBody(req, body => {
      const { patientName, date, doctor, status } = body;
      if (!patientName || !date || !doctor) {
        sendJson(res, 400, { success: false, message: 'Patient name, date and doctor are required.' });
        return;
      }
      const appointment = { id: Date.now(), patientName, date, doctor, status: status || 'Pending' };
      appointments.push(appointment);
      sendJson(res, 201, { success: true, message: 'Appointment booked successfully', data: appointment });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/doctors') {
    sendJson(res, 200, { success: true, data: doctors });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/doctors') {
    parseBody(req, body => {
      const { name, specialty } = body;
      if (!name || !specialty) {
        sendJson(res, 400, { success: false, message: 'Doctor name and specialty are required.' });
        return;
      }
      const doctor = {
        id: Date.now(),
        name,
        specialty,
        active: true,
        presentToday: true
      };
      doctors.push(doctor);
      sendJson(res, 201, { success: true, message: 'Doctor added successfully', data: doctor });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/staff') {
    sendJson(res, 200, { success: true, data: staff });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/staff') {
    parseBody(req, body => {
      const { name, role, department } = body;
      if (!name || !role || !department) {
        sendJson(res, 400, { success: false, message: 'Name, role and department are required.' });
        return;
      }
      const newStaff = {
        id: Date.now(),
        name,
        role,
        department,
        active: true,
        presentToday: true
      };
      staff.push(newStaff);
      sendJson(res, 201, { success: true, message: 'Staff member added successfully', data: newStaff });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/patient-records') {
    sendJson(res, 200, { success: true, data: patientRecords });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/patient-records') {
    parseBody(req, body => {
      const { patientName, note, date } = body;
      if (!patientName || !note || !date) {
        sendJson(res, 400, { success: false, message: 'Patient name, note and date are required.' });
        return;
      }
      const record = { id: Date.now(), patientName, note, date };
      patientRecords.push(record);
      sendJson(res, 201, { success: true, message: 'Patient record saved successfully', data: record });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/contact-messages') {
    sendJson(res, 200, { success: true, data: contactMessages });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/contact-messages') {
    parseBody(req, async body => {
      const { name, email, message } = body;
      if (!name || !email || !message) {
        sendJson(res, 400, { success: false, message: 'Name, email and message are required.' });
        return;
      }
      const contactMessage = {
        id: Date.now(),
        name,
        email,
        message,
        receivedAt: new Date().toLocaleString()
      };
      contactMessages.push(contactMessage);

      const emailResult = await sendContactEmail(contactMessage);
      sendJson(res, 201, {
        success: true,
        message: emailResult.success
          ? 'Your message has been sent successfully.'
          : 'Your message was saved locally, but email delivery is not configured yet.',
        data: contactMessage,
        email: emailResult
      });
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  }[ext] || 'text/plain; charset=utf-8';

  if (fs.existsSync(filePath)) {
    serveStaticFile(res, filePath, contentType);
  } else {
    serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
  }
});

server.listen(PORT, () => {
  console.log(`Hospital management server running at http://localhost:${PORT}`);
});
