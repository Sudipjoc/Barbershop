const barberId = localStorage.getItem("barberId") || null;
const token = localStorage.getItem("token") || null;
const socket = io();

if (!barberId || !token) {
  localStorage.clear();
  window.location.href = "/login.html";
}

// Elements
const statusText = document.getElementById("shopStatusDisplay");
const statusToggle = document.getElementById("shopToggle");
const availabilitySelect = document.getElementById("availabilityToggle");
const availabilityDisplay = document.getElementById("availabilityStatusDisplay");
const messageBox = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");
const serviceBody = document.getElementById("serviceTableBody");
const addServiceForm = document.getElementById("addServiceForm");
const employeeForm = document.getElementById("addEmployeeForm");
const employeeList = document.getElementById("employeeTableBody");
const dropZone = document.getElementById("dropZone");
const photoInput = document.getElementById("employeePhoto");
const previewImage = document.getElementById("previewImage");

// Logout
logoutBtn?.addEventListener("click", () => logout());

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `alert alert-${type}`;
  messageBox.style.display = "block";
  setTimeout(() => (messageBox.style.display = "none"), 3000);
}

// ---------------- SHOP STATUS ----------------
function updateStatusUI(status) {
  statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  statusToggle.checked = status === "open";
  statusText.className = `shop-status ${status}`;
}

async function fetchBarberStatus() {
  const res = await fetch(`http://localhost:5000/barber/${barberId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const data = await res.json();
  updateStatusUI(data.shopStatus);
}

statusToggle?.addEventListener("change", async () => {
  const status = statusToggle.checked ? "open" : "closed";
  const res = await fetch("http://localhost:5000/barber/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (res.status === 401) return logout();
  const data = await res.json();
  updateStatusUI(data.barber.shopStatus);
  socket.emit("shopStatusUpdate", { barberId, status: data.barber.shopStatus });
  showMessage("Shop status updated", "success");
});

// ---------------- AVAILABILITY ----------------
function updateAvailabilityUI(status) {
  availabilityDisplay.textContent = status;
  availabilityDisplay.className = `availability-status ${status.toLowerCase()}`;
  availabilitySelect.value = status;
}

async function fetchAvailabilityStatus() {
  const res = await fetch("http://localhost:5000/barber/me/availability", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const data = await res.json();
  updateAvailabilityUI(data.availabilityStatus);
}

availabilitySelect?.addEventListener("change", async () => {
  const availabilityStatus = availabilitySelect.value;
  const res = await fetch("http://localhost:5000/barber/availability", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` },
    body: JSON.stringify({ availabilityStatus }),
  });
  if (res.status === 401) return logout();
  const data = await res.json();
  showMessage(data.message, "success");
  updateAvailabilityUI(data.availabilityStatus);
});

// ---------------- NAVIGATION ----------------
function showSection(section) {
  const sections = ["addServiceSection", "employeesSection", "bookingSection"];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === `${section}Section` ? "block" : "none";
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.textContent.toLowerCase().includes(section.toLowerCase())) {
      link.classList.add("active");
    }
  });
}

// ---------------- SERVICES ----------------
async function fetchServices() {
  const res = await fetch("http://localhost:5000/barber/services", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const services = await res.json();
  serviceBody.innerHTML = services.map(
    (srv, i) => `
      <tr>
        <td>${srv.type}</td>
        <td>NPR ${srv.price}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editService(${i}, '${srv.type}', ${srv.price})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteService(${i})">Delete</button>
        </td>
      </tr>`
  ).join("");
}

addServiceForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const type = document.getElementById("newServiceType").value;
  const price = document.getElementById("newServicePrice").value;
  const res = await fetch("http://localhost:5000/barber/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, price }),
  });
  if (res.status === 401) return logout();
  showMessage("Service added", "success");
  addServiceForm.reset();
  fetchServices();
});

window.editService = async (index, currentType, currentPrice) => {
  const newType = prompt("Edit service type:", currentType);
  const newPrice = prompt("Edit service price:", currentPrice);
  if (!newType || !newPrice) return;
  const res = await fetch(`http://localhost:5000/barber/services/${index}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type: newType, price: newPrice }),
  });
  if (res.status === 401) return logout();
  showMessage("Service updated", "success");
  fetchServices();
};

window.deleteService = async index => {
  const res = await fetch(`http://localhost:5000/barber/services/${index}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  showMessage("Service deleted", "success");
  fetchServices();
};

// ---------------- EMPLOYEES ----------------
async function fetchEmployees() {
  const res = await fetch("http://localhost:5000/barber/employees", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const employees = await res.json();
  employeeList.innerHTML = employees.map(
    emp => `
      <tr>
        <td><img src="${emp.photo}" height="50" /></td>
        <td>${emp.name}</td>
        <td>${emp.job}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editEmployee('${emp._id}', '${emp.name}', '${emp.job}', '${emp.photo}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${emp._id}')">Delete</button>
        </td>
      </tr>`
  ).join("");
}

employeeForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("employeeName").value;
  const job = document.getElementById("employeeJob").value;
  const photoFile = document.getElementById("employeePhoto").files[0];
  const formData = new FormData();
  formData.append("name", name);
  formData.append("job", job);
  formData.append("photo", photoFile);

  const res = await fetch("http://localhost:5000/barber/employees/add", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (res.status === 401) return logout();
  showMessage("Employee added", "success");
  employeeForm.reset();
  previewImage.style.display = "none";
  fetchEmployees();
});

window.editEmployee = async (id, name, job, photo) => {
  const newName = prompt("Edit name:", name);
  const newJob = prompt("Edit job:", job);
  if (!newName || !newJob) return;

  const res = await fetch(`http://localhost:5000/barber/employees/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: newName, job: newJob, photo }),
  });
  if (res.status === 401) return logout();
  showMessage("Employee updated", "success");
  fetchEmployees();
};

window.deleteEmployee = async id => {
  const res = await fetch(`http://localhost:5000/barber/employees/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  showMessage("Employee deleted", "success");
  fetchEmployees();
};

// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {
  fetchBarberStatus();
  fetchAvailabilityStatus();
  fetchServices();
  fetchEmployees();
  showBookingSection("Pending");
});
