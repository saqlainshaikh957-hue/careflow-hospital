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
const loginMessage = document.getElementById('login-message');

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
    const staff = await staffRes.json();
    const patientRecordsData = await patientRecordsRes.json();

    if (statsContainer) {
      renderStats(overview.data);
    }
    if (patientsList || patientRecordsList) {
      renderPatients(patients.data);
    }
    if (appointmentsList || appointmentRecordsList) {
      renderAppointments(appointments.data);
    }
    if (doctorSelects.some(Boolean)) {
      renderDoctors(doctors.data);
    }
    if (adminDoctorsList) {
      renderAdminDoctors(doctors.data);
    }
    if (adminStaffList) {
      renderAdminStaff(staff.data);
    }
    if (doctorPresenceCount || staffPresenceCount) {
      renderPresence(doctors.data, staff.data);
    }
    if (patientRecordsDashboardList) {
      renderPatientRecords(patientRecordsData.data);
    }
    if (doctorCountMessage || doctorAvailabilityList) {
      renderDoctorAvailability(doctors.data);
    }
    if (doctorDirectoryList || patientDoctorDirectoryList) {
      renderDoctorDirectory(doctors.data);
    }
  } catch (error) {
    console.error('Failed to load hospital data', error);
  }
}

function renderStats(data) {
  statsContainer.innerHTML = `
    <div class="stat-card"><h3>Total Patients</h3><p>${data.patients}</p></div>
    <div class="stat-card"><h3>Appointments</h3><p>${data.appointments}</p></div>
    <div class="stat-card"><h3>Active Doctors</h3><p>${data.doctors}</p></div>
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
      <li><strong>${item.name}</strong> · Age ${item.age} · ${item.doctor} · <em>${item.status}</em></li>
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
      <li><strong>${item.patientName}</strong> · ${item.date} · ${item.doctor} · <em>${item.status}</em></li>
    `).join('');
  });
}

function renderDoctors(items) {
  doctorSelects.forEach(select => {
    if (select) {
      select.innerHTML = items.map(doc => `<option value="${doc.name}">${doc.name}</option>`).join('');
    }
  });
}

function renderAdminDoctors(items) {
  adminDoctorsList.innerHTML = items.map(item => `<li><strong>${item.name}</strong> · ${item.specialty}</li>`).join('');
}

function renderAdminStaff(items) {
  adminStaffList.innerHTML = items.map(item => `<li><strong>${item.name}</strong> · ${item.role} · ${item.department}</li>`).join('');
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
  if (!items.length) {
    patientRecordsDashboardList.innerHTML = '<li>No records yet.</li>';
    return;
  }
  patientRecordsDashboardList.innerHTML = items.map(item => `<li><strong>${item.patientName}</strong> · ${item.date} · ${item.note}</li>`).join('');
}

function renderDoctorAvailability(items) {
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
          <strong>${item.name}</strong>
          <div>${item.specialty}</div>
          <div>Current status: <strong>${item.active ? 'Available now' : 'Not available now'}</strong></div>
          <div>Presence: <strong>${item.presentToday ? 'Present today' : 'Not present today'}</strong></div>
          <span class="doctor-status ${item.active ? 'active' : 'inactive'}">
            ${item.active ? 'Available' : 'Unavailable'}
          </span>
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
          <strong>${item.name}</strong>
          <div>${item.specialty}</div>
          <div>Presence: <strong>${item.presentToday ? 'Present today' : 'Not present today'}</strong></div>
          <span class="doctor-status ${item.active ? 'active' : 'inactive'}">
            ${item.active ? 'Available' : 'Unavailable'}
          </span>
        </div>
      `).join('')
      : '<div class="doctor-card">No doctors available.</div>';
  });
}

async function submitForm(form, endpoint, messageEl) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (messageEl) {
    messageEl.textContent = result.message || 'Request completed';
  }
  if (result.success) {
    form.reset();
    loadData();
  }
}

if (patientForm) {
  patientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(patientForm, '/api/patients', patientMessage);
  });
}

if (appointmentForm) {
  appointmentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitForm(appointmentForm, '/api/appointments', appointmentMessage);
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
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    if (email === 'admin@careflow.com' && password === '123456') {
      if (loginMessage) {
        loginMessage.textContent = 'Login successful. Welcome to the hospital portal.';
      }
      window.location.href = '/admin.html';
    } else {
      if (loginMessage) {
        loginMessage.textContent = 'Invalid email or password. Try the demo credentials.';
      }
    }
  });
}

if (statsContainer || appointmentsList || patientsList || patientRecordsList || appointmentRecordsList || patientForm || appointmentForm || doctorForm || staffForm || patientRecordForm || loginForm || document.getElementById('doctor-select') || document.getElementById('appointment-doctor-select')) {
  loadData();
}
