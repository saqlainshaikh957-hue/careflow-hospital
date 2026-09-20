const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DOCTORS_FILE = path.join(DATA_DIR, 'doctors.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const sessions = new Map();
const SESSION_MAX_AGE = 8 * 60 * 60;

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentDateString() {
  return getLocalDateString(new Date());
}

const validTimeSlots = ['08:00', '09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
const todayDate = getCurrentDateString();

const defaultPatients = [
  { id: 1, name: 'Amina Yusuf', age: 29, doctor: 'Dr. Ada Okafor', status: 'Stable', registrationDate: '2026-08-01' },
  { id: 2, name: 'Tunde Bello', age: 41, doctor: 'Dr. Michael Chen', status: 'Pending Review', registrationDate: '2026-08-02' }
];

const defaultAppointments = [
  { id: 1, patientName: 'Amina Yusuf', date: '2026-08-01', time: '09:00', doctor: 'Dr. Ada Okafor', status: 'Confirmed' },
  { id: 2, patientName: 'Tunde Bello', date: '2026-08-02', time: '15:30', doctor: 'Dr. Michael Chen', status: 'Pending' }
];

function loadAppointments() {
  try {
    const existing = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8'));
    return existing.map(appointment => {
      const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(appointment.date || '') ? appointment.date : todayDate;
      const normalizedTime = validTimeSlots.includes(appointment.time) ? appointment.time : '09:00';
      return {
        ...appointment,
        date: normalizedDate,
        time: normalizedTime
      };
    });
  } catch {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(defaultAppointments, null, 2));
    return [...defaultAppointments];
  }
}

function saveAppointments() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
}

const defaultDoctors = [
  { id: 1, name: 'Dr. Ada Okafor', specialty: 'General Medicine', active: true, presentToday: true },
  { id: 2, name: 'Dr. Michael Chen', specialty: 'Cardiology', active: false, presentToday: false },
  { id: 3, name: 'Dr. Sara Ibrahim', specialty: 'Pediatrics', active: true, presentToday: true }
];

function loadPatients() {
  try {
    const existing = JSON.parse(fs.readFileSync(PATIENTS_FILE, 'utf8'));
    return existing.map(patient => ({
      ...patient,
      registrationDate: patient.registrationDate || todayDate
    }));
  } catch {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PATIENTS_FILE, JSON.stringify(defaultPatients, null, 2));
    return [...defaultPatients];
  }
}

function savePatients() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PATIENTS_FILE, JSON.stringify(patients, null, 2));
}

function loadDoctors() {
  try {
    return JSON.parse(fs.readFileSync(DOCTORS_FILE, 'utf8'));
  } catch {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DOCTORS_FILE, JSON.stringify(defaultDoctors, null, 2));
    return [...defaultDoctors];
  }
}

function saveDoctors() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DOCTORS_FILE, JSON.stringify(doctors, null, 2));
}

let patients = loadPatients();
let appointments = loadAppointments();
let doctors = loadDoctors();

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

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(cookie => {
    const separator = cookie.indexOf('=');
    return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1).trim())];
  }));
}

function isAdminAuthenticated(req) {
  const token = parseCookies(req).admin_session;
  return Boolean(token && sessions.has(token));
}

function sendRedirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function protectAdminApi(req, res) {
  if (isAdminAuthenticated(req)) {
    return true;
  }
  sendJson(res, 401, { success: false, message: 'Administrator authentication required.' });
  return false;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    parseBody(req, body => {
      const username = typeof body.username === 'string' ? body.username : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD ||
        username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        sendJson(res, 401, { success: false, message: 'Invalid username or password' });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, true);
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `admin_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure}`,
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({ success: true, message: 'Login successful.' }));
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    const authenticated = isAdminAuthenticated(req);
    sendJson(res, authenticated ? 200 : 401, { success: authenticated });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = parseCookies(req).admin_session;
    if (token) {
      sessions.delete(token);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (url.pathname === '/admin' || url.pathname === '/admin.html') {
    if (!isAdminAuthenticated(req)) {
      sendRedirect(res, '/login.html?next=/admin.html');
      return;
    }
    if (url.pathname === '/admin') {
      sendRedirect(res, '/admin.html');
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
  }

  if (req.method === 'GET' && url.pathname === '/api/overview') {
    const today = getCurrentDateString();
    const todayAppointments = appointments.filter(appointment => appointment.date === today).length;
    const upcomingAppointments = appointments.filter(appointment => appointment.date > today).length;

    sendJson(res, 200, {
      success: true,
      message: 'Hospital overview loaded successfully',
      data: {
        patients: patients.length,
        appointments: appointments.length,
        doctors: doctors.length,
        todayAppointments,
        upcomingAppointments
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
      const parsedAge = Number(age);

      if (!name || !doctor || !Number.isFinite(parsedAge) || parsedAge <= 0) {
        sendJson(res, 400, {
          success: false,
          message: !name || !doctor ? 'Name and doctor are required.' : 'Please enter a valid age.'
        });
        return;
      }

      const patient = {
        id: Date.now(),
        name: String(name).trim(),
        age: parsedAge,
        doctor: String(doctor).trim(),
        status: status ? String(status).trim() : 'Registered',
        registrationDate: getCurrentDateString()
      };

      patients.push(patient);
      savePatients();
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
      const { patientName, date, doctor, status, time } = body;
      if (!patientName || !date || !doctor) {
        sendJson(res, 400, { success: false, message: 'Patient name, date and doctor are required.' });
        return;
      }

      const appointmentDate = String(date).trim();
      const selectedTime = String(time || '08:00').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
        sendJson(res, 400, { success: false, message: 'Please choose a valid appointment date.' });
        return;
      }
      if (!validTimeSlots.includes(selectedTime)) {
        sendJson(res, 400, { success: false, message: 'Please choose a valid appointment time slot.' });
        return;
      }

      const today = getCurrentDateString();
      if (appointmentDate < today) {
        sendJson(res, 400, { success: false, message: 'Appointment date cannot be in the past.' });
        return;
      }

      if (appointmentDate === today) {
        const now = new Date();
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const appointmentMinutes = hours * 60 + minutes;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (appointmentMinutes <= currentMinutes) {
          sendJson(res, 400, { success: false, message: 'Appointment time must be later than the current time for today.' });
          return;
        }
      }

      const appointment = {
        id: Date.now(),
        patientName: String(patientName).trim(),
        date: appointmentDate,
        time: selectedTime,
        doctor: String(doctor).trim(),
        status: status ? String(status).trim() : 'Pending'
      };

      appointments.push(appointment);
      saveAppointments();
      sendJson(res, 201, { success: true, message: 'Appointment booked successfully', data: appointment });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/doctors') {
    sendJson(res, 200, { success: true, data: doctors });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/doctors') {
    if (!protectAdminApi(req, res)) {
      return;
    }
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
      saveDoctors();
      sendJson(res, 201, { success: true, message: 'Doctor added successfully', data: doctor });
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/staff') {
    if (!protectAdminApi(req, res)) {
      return;
    }
    sendJson(res, 200, { success: true, data: staff });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/staff') {
    if (!protectAdminApi(req, res)) {
      return;
    }
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
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!name || !email || !message) {
        sendJson(res, 400, { success: false, message: 'Name, email and message are required.' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJson(res, 400, { success: false, message: 'Please enter a valid email address.' });
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Hospital management server running on port ${PORT}`);
});
