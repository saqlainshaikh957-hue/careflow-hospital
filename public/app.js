const statsContainer = document.getElementById('stats');
const appointmentsList = document.getElementById('appointments-list');
const patientsList = document.getElementById('patients-list');
const patientRecordsList = document.getElementById('patient-records-list');
const appointmentRecordsList = document.getElementById('appointment-records-list');
const patientForm = document.getElementById('patient-form');
const appointmentForm = document.getElementById('appointment-form');
const doctorForm = document.getElementById('doctor-form');
const staffForm = document.getElementById('staff-form');
const patientRecordForm = document.getElementById('patient-record-form');
const contactForm = document.getElementById('contact-form');
const loginForm = document.getElementById('login-form');
const patientMessage = document.getElementById('patient-message');
const appointmentMessage = document.getElementById('appointment-message');
const doctorMessage = document.getElementById('doctor-message');
const staffMessage = document.getElementById('staff-message');
const patientRecordMessage = document.getElementById('patient-record-message');
const contactMessage = document.getElementById('contact-message');
const doctorSelects = [document.getElementById('doctor-select'), document.getElementById('appointment-doctor-select')];
const adminDoctorsList = document.getElementById('admin-doctors-list');
const adminStaffList = document.getElementById('admin-staff-list');
const doctorPresenceCount = document.getElementById('doctor-presence-count');
const doctorPresenceList = document.getElementById('doctor-presence-list');
const staffPresenceCount = document.getElementById('staff-presence-count');
const staffPresenceList = document.getElementById('staff-presence-list');
const patientRecordsDashboardList = document.getElementById('patient-records-dashboard-list');
const doctorCountMessage = document.getElementById('doctor-count-message');
const doctorAvailabilityList = document.getElementById('doctor-availability-list');
const doctorDirectoryList = document.getElementById('doctor-directory-list');
const patientDoctorDirectoryList = document.getElementById('patient-doctor-directory-list');
const homepageDoctorsList = document.getElementById('homepage-doctors-list');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logout-button');
const adminOverviewStats = document.getElementById('admin-overview-stats');
const doctorPortalAppointments = document.getElementById('doctor-portal-appointments');
const bookingDateInput = document.getElementById('appointment-date');
const bookingTimeSelect = document.getElementById('appointment-time');

const doctorImageMap = {
  'dr. ada okafor': '/images/doctor-ada.jpg',
  'dr. michael chen': '/images/doctor-michael.jpg',
  'dr. sara ibrahim': '/images/doctor-sara.jpg',
  'dr. priyansh nair': '/images/doctor-priya.jpg',
  'dr. james adeyemi': '/images/doctor-james.jpg'
};
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDoctorImage(doctor) {
  return doctorImageMap[String(doctor.name || '').toLowerCase()] || '/images/doctor-default.jpg';
}

function isDoctorAvailableOnDate(doctor, dateValue) {
  if (doctor.availabilityDay === undefined || !dateValue) return true;
  return new Date(`${dateValue}T12:00:00`).getDay() === doctor.availabilityDay;
}

function getDoctorAvailabilityLabel(doctor) {
  return doctor.availabilityLabel || 'Available during regular clinic hours';
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayISO() {
  return getLocalDateString(new Date());
}

function formatDateLabel(dateValue) {
  if (!dateValue) return 'Not scheduled';
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return 'Time not set';
  const [hours, minutes] = timeValue.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function setMessage(element, message, isSuccess = true) {
  if (!element) return;
  element.className = `message ${isSuccess ? 'success' : 'error'}`;
  element.innerHTML = message;
}

function getAvailableTimeSlots(dateValue) {
  const slots = ['08:00', '09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
  const today = getTodayISO();
  if (dateValue !== today) return slots;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.filter(slot => {
    const [hours, minutes] = slot.split(':').map(Number);
    return (hours * 60 + minutes) > currentMinutes;
  });
}

function updateTimeSlots() {
  if (!bookingDateInput || !bookingTimeSelect) return;

  const selectedDate = bookingDateInput.value || getTodayISO();
  if (window.hospitalDoctors) renderDoctors(window.hospitalDoctors);
  const slots = getAvailableTimeSlots(selectedDate);
  const doctorSelect = document.getElementById('appointment-doctor-select');
  const bookedTimes = (window.hospitalAppointments || [])
    .filter(item => item.date === selectedDate && item.doctor === (doctorSelect ? doctorSelect.value : ''))
    .map(item => item.time);

  bookingTimeSelect.innerHTML = slots.length
    ? `<option value="">Select a time</option>${slots.map(slot => {
        const disabled = bookedTimes.includes(slot) ? 'disabled' : '';
        const label = disabled ? `${formatTimeLabel(slot)} (Booked)` : formatTimeLabel(slot);
        return `<option value="${slot}" ${disabled}>${label}</option>`;
      }).join('')}`
    : '<option value="">No slots available</option>';
}

function renderStats(data) {
  if (!statsContainer) return;
  statsContainer.innerHTML = `
    <div class="stat-card"><h3>Total Patients</h3><p>${data.patients || 0}</p></div>
    <div class="stat-card"><h3>Today's Appointments</h3><p>${data.todayAppointments || 0}</p></div>
    <div class="stat-card"><h3>Upcoming Appointments</h3><p>${data.upcomingAppointments || 0}</p></div>
    <div class="stat-card"><h3>Active Doctors</h3><p>${data.doctors || 0}</p></div>
  `;
}

function renderAdminOverview(data) {
  if (!adminOverviewStats) return;
  adminOverviewStats.innerHTML = `
    <div class="stat-card compact"><h3>Total Patients</h3><p>${data.patients || 0}</p></div>
    <div class="stat-card compact"><h3>Total Doctors</h3><p>${data.doctors || 0}</p></div>
    <div class="stat-card compact"><h3>Today</h3><p>${data.todayAppointments || 0}</p></div>
    <div class="stat-card compact"><h3>Upcoming</h3><p>${data.upcomingAppointments || 0}</p></div>
  `;
}

function renderPatients(items) {
  const targets = [patientsList, patientRecordsList].filter(Boolean);
  targets.forEach(target => {
    if (!items.length) {
      target.innerHTML = '<li>No patients yet.</li>';
      return;
    }
    target.innerHTML = items.map(item => `
      <li class="list-item">
        <div><strong>${item.name}</strong></div>
        <div>Age ${item.age} · ${item.doctor}</div>
        <div class="meta-row">
          <span>${item.registrationDate ? `Registered: ${formatDateLabel(item.registrationDate)}` : 'Registration date not recorded'}</span>
          <span class="status-pill">${item.status || 'Registered'}</span>
        </div>
      </li>
    `).join('');
  });
}

function renderAppointments(items) {
  const targets = [appointmentsList, appointmentRecordsList].filter(Boolean);
  targets.forEach(target => {
    if (!items.length) {
      target.innerHTML = '<li>No appointments yet.</li>';
      return;
    }
    target.innerHTML = items.map(item => `
      <li class="list-item">
        <div><strong>${item.patientName}</strong></div>
        <div>${formatDateLabel(item.date)} · ${formatTimeLabel(item.time)}</div>
        <div>${item.doctor}</div>
        <div class="meta-row">
          <span>${item.reason || 'Consultation visit'}</span>
          <span class="status-pill">${item.status || 'Confirmed'}</span>
        </div>
      </li>
    `).join('');
  });
}

function renderDoctors(items) {
  doctorSelects.forEach(select => {
    if (!select) return;
    const availableItems = select.id === 'appointment-doctor-select' && bookingDateInput
      ? items.filter(item => isDoctorAvailableOnDate(item, bookingDateInput.value))
      : items;
    if (!availableItems.length) {
      select.innerHTML = '<option value="">No doctors available for this date</option>';
      return;
    }
    select.innerHTML = '<option value="">Select a doctor</option>' + availableItems.map(doc => `<option value="${doc.name}">${doc.name} — ${doc.specialty} (${getDoctorAvailabilityLabel(doc)})</option>`).join('');
  });
}

function renderAdminDoctors(items) {
  if (!adminDoctorsList) return;
  adminDoctorsList.innerHTML = items.length
    ? items.map(item => `<li class="list-item"><strong>${item.name}</strong><div>${item.specialty}</div><div>${getDoctorAvailabilityLabel(item)}</div></li>`).join('')
    : '<li>No doctors available.</li>';
}

function renderAdminStaff(items) {
  if (!adminStaffList) return;
  adminStaffList.innerHTML = items.length
    ? items.map(item => `<li class="list-item"><strong>${item.name}</strong><div>${item.role} · ${item.department}</div></li>`).join('')
    : '<li>No staff available.</li>';
}

function renderPresence(doctors, staff) {
  const presentDoctors = doctors.filter(item => item.presentToday === true);
  const presentStaff = staff.filter(item => item.presentToday === true);

  if (doctorPresenceCount) {
    doctorPresenceCount.textContent = `${presentDoctors.length} / ${doctors.length}`;
  }
  if (doctorPresenceList) {
    doctorPresenceList.innerHTML = presentDoctors.length
      ? presentDoctors.map(item => `<li><strong>${item.name}</strong> · ${item.specialty} · <em>${item.active ? 'Available' : 'Unavailable'}</em></li>`).join('')
      : '<li>No doctors marked present today.</li>';
  }

  if (staffPresenceCount) {
    staffPresenceCount.textContent = `${presentStaff.length} / ${staff.length}`;
  }
  if (staffPresenceList) {
    staffPresenceList.innerHTML = presentStaff.length
      ? presentStaff.map(item => `<li><strong>${item.name}</strong> · ${item.role} · ${item.department} · <em>${item.active ? 'Available' : 'Unavailable'}</em></li>`).join('')
      : '<li>No staff marked present today.</li>';
  }
}

function renderPatientRecords(items) {
  if (!patientRecordsDashboardList) return;
  if (!items.length) {
    patientRecordsDashboardList.innerHTML = '<li>No records yet.</li>';
    return;
  }
  patientRecordsDashboardList.innerHTML = items.map(item => `<li class="list-item"><strong>${item.patientName}</strong><div>${formatDateLabel(item.date)}</div><div>${item.note}</div></li>`).join('');
}

function renderDoctorAvailability(items) {
  if (!doctorCountMessage && !doctorAvailabilityList) return;
  const availableDoctors = items.filter(item => item.active === true);
  if (doctorCountMessage) {
    doctorCountMessage.textContent = availableDoctors.length > 0
      ? `Available doctors: ${availableDoctors.length} / ${items.length}`
      : 'No available doctors right now.';
  }
  if (doctorAvailabilityList) {
    doctorAvailabilityList.innerHTML = items.length
      ? items.map(item => `
        <div class="doctor-card">
          <img class="doctor-card-image" src="${getDoctorImage(item)}" alt="Professional portrait of ${item.name}" />
          <div class="doctor-card-details"><strong>${item.name}</strong>
          <div>${item.specialty}</div>
          <div>${getDoctorAvailabilityLabel(item)}</div>
          <div>Presence: <strong>${item.presentToday ? 'Present today' : 'Not present today'}</strong></div>
          <span class="doctor-status ${item.active ? 'active' : 'inactive'}">${item.active ? 'Available' : 'Unavailable'}</span></div>
        </div>
      `).join('')
      : '<div class="doctor-card">No doctors available.</div>';
  }
}

function renderDoctorDirectory(items) {
  const targets = [doctorDirectoryList, patientDoctorDirectoryList].filter(Boolean);
  targets.forEach(target => {
    target.innerHTML = items.length
      ? items.map(item => `
        <div class="doctor-card">
          <img class="doctor-card-image" src="${getDoctorImage(item)}" alt="Professional portrait of ${item.name}" />
          <div class="doctor-card-details"><strong>${item.name}</strong>
          <div>${item.specialty}</div>
          <div>${getDoctorAvailabilityLabel(item)}</div>
          <div>Presence: <strong>${item.presentToday ? 'Present today' : 'Not present today'}</strong></div>
          <span class="doctor-status ${item.active ? 'active' : 'inactive'}">${item.active ? 'Available' : 'Unavailable'}</span></div>
        </div>
      `).join('')
      : '<div class="doctor-card">No doctors available.</div>';
  });
}

function renderHomepageDoctors(items) {
  if (!homepageDoctorsList) return;
  homepageDoctorsList.innerHTML = items.length
    ? items.map(item => `<li><strong>${item.name}</strong> · ${item.specialty} · ${getDoctorAvailabilityLabel(item)}</li>`).join('')
    : '<li>No doctors available.</li>';
}

function renderDoctorPortal(items, appointments) {
  if (!doctorPortalAppointments) return;

  const today = getTodayISO();
  const todayList = appointments.filter(item => item.date === today);
  const upcomingList = appointments.filter(item => item.date > today);
  const pastList = appointments.filter(item => item.date < today);

  doctorPortalAppointments.innerHTML = `
    <div class="appointment-panel-group">
      <h3>Today's Appointments</h3>
      ${todayList.length ? todayList.map(item => `<div class="appointment-item"><strong>${item.patientName}</strong><span>${formatTimeLabel(item.time)}</span><span>${item.status}</span></div>`).join('') : '<p class="muted-text">No appointments scheduled for today.</p>'}
    </div>
    <div class="appointment-panel-group">
      <h3>Upcoming Appointments</h3>
      ${upcomingList.length ? upcomingList.map(item => `<div class="appointment-item"><strong>${item.patientName}</strong><span>${formatDateLabel(item.date)}</span><span>${item.status}</span></div>`).join('') : '<p class="muted-text">No upcoming appointments.</p>'}
    </div>
    <div class="appointment-panel-group">
      <h3>Past/Completed Appointments</h3>
      ${pastList.length ? pastList.map(item => `<div class="appointment-item"><strong>${item.patientName}</strong><span>${formatDateLabel(item.date)}</span><span>${item.status}</span></div>`).join('') : '<p class="muted-text">No past records.</p>'}
    </div>
  `;
}

async function submitForm(form, endpoint, messageEl, successRenderer) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (result.success && successRe  /images/hero-hospital.jpg  /images/hero-hospital.jpg  /images/hero-hospital.jpgnderer) {
    setMessage(messageEl, successRenderer(result.data || payload, result), true);
  } else {
    setMessage(messageEl, result.message || 'Something went wrong.', false);
  }

  if (result.success) {
    form.reset();
    if (bookingDateInput && bookingTimeSelect) {
      bookingDateInput.value = getTodayISO();
      updateTimeSlots();
    }
    await loadData();
  }
}

async function checkAdminSession() {
  const response = await fetch('/api/auth/me', { cache: 'no-store' });
  if (!response.ok) {
    window.location.replace('/login.html?next=/admin.html');
    return false;
  }
  return true;
}

async function loadData() {
  try {
    const [overviewRes, patientsRes, appointmentsRes, doctorsRes, staffRes, patientRecordsRes] = await Promise.all([
      fetch('/api/overview'),
      fetch('/api/patients'),
      fetch('/api/appointments'),
      fetch('/api/doctors'),
      fetch('/api/staff'),
      fetch('/api/patient-records')
    ]);

    const overview = await overviewRes.json();
    const patients = await patientsRes.json();
    const appointments = await appointmentsRes.json();
    const doctors = await doctorsRes.json();
    const staffResponse = await staffRes.json();
    const staff = staffResponse.success ? staffResponse : { data: [] };
    const patientRecordsData = await patientRecordsRes.json();

    window.hospitalAppointments = appointments.data || [];
    window.hospitalDoctors = doctors.data || [];

    if (statsContainer) renderStats(overview.data || {});
    if (adminOverviewStats) renderAdminOverview(overview.data || {});
    if (patientsList || patientRecordsList) renderPatients(patients.data || []);
    if (appointmentsList || appointmentRecordsList) renderAppointments(appointments.data || []);
    if (doctorSelects.some(Boolean)) renderDoctors(doctors.data || []);
    if (adminDoctorsList) renderAdminDoctors(doctors.data || []);
    if (adminStaffList) renderAdminStaff(staff.data || []);
    if (doctorPresenceCount || staffPresenceCount) renderPresence(doctors.data || [], staff.data || []);
    if (patientRecordsDashboardList) renderPatientRecords(patientRecordsData.data || []);
    if (doctorCountMessage || doctorAvailabilityList) renderDoctorAvailability(doctors.data || []);
    if (doctorDirectoryList || patientDoctorDirectoryList) renderDoctorDirectory(doctors.data || []);
    if (homepageDoctorsList) renderHomepageDoctors(doctors.data || []);
    if (doctorPortalAppointments) renderDoctorPortal(doctors.data || [], appointments.data || []);
    if (bookingDateInput && bookingTimeSelect) {
      bookingDateInput.min = getTodayISO();
      bookingDateInput.value = getTodayISO();
      updateTimeSlots();
    }
  } catch (error) {
    console.error('Failed to load hospital data', error);
  }
}

if (patientForm) {
  patientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(patientForm, '/api/patients', patientMessage, (data) => `
      <div class="success-card">
        <h3>Patient Registered Successfully</h3>
        <p><strong>Patient ID:</strong> ${data.id || 'Generated'}</p>
        <p><strong>Patient Name:</strong> ${data.name || 'Patient'}</p>
        <p><strong>Registration Date:</strong> ${formatDateLabel(getTodayISO())}</p>
      </div>
    `);
  });
}

if (appointmentForm) {
  appointmentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(appointmentForm, '/api/appointments', appointmentMessage, (data) => `
      <div class="success-card">
        <h3>Appointment Booked Successfully</h3>
        <p><strong>Patient:</strong> ${data.patientName || 'Patient'}</p>
        <p><strong>Doctor:</strong> ${data.doctor || 'Doctor'}</p>
        <p><strong>Date:</strong> ${formatDateLabel(data.date || getTodayISO())}</p>
        <p><strong>Time:</strong> ${formatTimeLabel(data.time || '08:00')}</p>
        <p><strong>Appointment ID:</strong> ${data.appointmentId || 'CF-NEW'}</p>
        <p><strong>Status:</strong> ${data.status || 'Confirmed'}</p>
      </div>
    `);
  });
}

if (doctorForm) {
  doctorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(doctorForm, '/api/doctors', doctorMessage);
  });
}

if (staffForm) {
  staffForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(staffForm, '/api/staff', staffMessage);
  });
}

if (patientRecordForm) {
  patientRecordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(patientRecordForm, '/api/patient-records', patientRecordMessage);
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(contactForm, '/api/contact-messages', contactMessage);
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (loginMessage) {
      loginMessage.textContent = result.message || 'Login failed.';
      loginMessage.className = result.success ? 'message success' : 'message error';
    }
    if (result.success) {
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.replace(next === '/admin.html' ? next : '/admin.html');
    }
  });
}

if (logoutButton) {
  checkAdminSession();
  logoutButton.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/login.html');
  });
  window.addEventListener('pageshow', checkAdminSession);
}

if (bookingDateInput && bookingTimeSelect) {
  bookingDateInput.min = getTodayISO();
  bookingDateInput.value = getTodayISO();
  updateTimeSlots();
  bookingDateInput.addEventListener('change', updateTimeSlots);
  const doctorSelect = document.getElementById('appointment-doctor-select');
  if (doctorSelect) {
    doctorSelect.addEventListener('change', updateTimeSlots);
  }
}

if (statsContainer || appointmentsList || patientsList || patientRecordsList || appointmentRecordsList || patientForm || appointmentForm || doctorForm || staffForm || patientRecordForm || doctorCountMessage || doctorAvailabilityList || doctorDirectoryList || adminOverviewStats || document.getElementById('doctor-select') || document.getElementById('appointment-doctor-select') || doctorPortalAppointments) {
  loadData();
}
