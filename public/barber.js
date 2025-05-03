const barberId = localStorage.getItem("barberId") || null;
const token = localStorage.getItem("token") || null;
const socket = io();

if (!barberId || !token) {
  console.error("Missing barberId or token, redirecting to login");
  localStorage.clear();
  window.location.href = "/login.html";
}

const statusText = document.getElementById("shopStatusDisplay");
const statusToggle = document.getElementById("shopToggle");
const messageBox = document.getElementById("message");
const revenueBox = document.getElementById("revenueTotal");
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `alert alert-${type}`;
  messageBox.style.display = "block";
  setTimeout(() => (messageBox.style.display = "none"), 3000);
}

function updateStatusUI(status) {
  if (!statusText || !statusToggle) return;
  statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  statusText.className = `shop-status ${status}`;
  statusToggle.checked = status === "open";
}

async function fetchBarberStatus() {
  if (!barberId) return;
  try {
    const res = await fetch(`http://localhost:5000/barber/${barberId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();
    if (data.shopStatus) {
      updateStatusUI(data.shopStatus);
      localStorage.setItem("shopStatus", data.shopStatus);
    }
  } catch (err) {
    console.error("❌ Error fetching barber status:", err);
    showMessage("Error loading shop status", "danger");
  }
}

statusToggle?.addEventListener("change", async () => {
  const status = statusToggle.checked ? "open" : "closed";
  try {
    const res = await fetch(`http://localhost:5000/barber/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data?.barber?.shopStatus) {
      updateStatusUI(data.barber.shopStatus);
      localStorage.setItem("shopStatus", data.barber.shopStatus);
      showMessage("Shop status updated", "success");
      socket.emit("shopStatusUpdate", { barberId, status: data.barber.shopStatus });
    } else {
      showMessage("Failed to update status", "danger");
    }
  } catch (err) {
    console.error("❌ Error updating shop status:", err);
    showMessage("Failed to update shop status", "danger");
    statusToggle.checked = !statusToggle.checked;
  }
});

function showSection(section) {
  const allSections = [
    "confirmedSection",
    "pendingSection",
    "completedSection",
    "addServiceSection",
    "employeesSection"
  ];

  allSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = (id === section + "Section") ? "block" : "none";
    }
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove("active");
    if (link.textContent.toLowerCase().includes(section)) {
      link.classList.add("active");
    }
  });
}

// Service Management
const serviceBody = document.getElementById("serviceTableBody");
const addServiceForm = document.getElementById("addServiceForm");

async function fetchServices() {
  const res = await fetch("http://localhost:5000/barber/services", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const services = await res.json();
  serviceBody.innerHTML = services.map((srv, i) => `
    <tr>
      <td>${srv.type}</td>
      <td>NPR ${srv.price}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-warning" onclick="editService(${i}, '${srv.type}', ${srv.price})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteService(${i})">Delete</button>
      </td>
    </tr>
  `).join("");
}

addServiceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = document.getElementById("newServiceType").value;
  const price = document.getElementById("newServicePrice").value;
  const res = await fetch("http://localhost:5000/barber/services", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type, price })
  });
  const data = await res.json();
  showMessage(data.msg || "Service added", "success");
  addServiceForm.reset();
  fetchServices();
});

window.editService = async (index, currentType, currentPrice) => {
  const newType = prompt("Update service type:", currentType);
  const newPrice = prompt("Update service price:", currentPrice);
  if (!newType || !newPrice) return;
  const res = await fetch(`http://localhost:5000/barber/services/${index}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: newType, price: newPrice })
  });
  const data = await res.json();
  showMessage(data.msg || "Updated!", "success");
  fetchServices();
};

window.deleteService = async (index) => {
  const res = await fetch(`http://localhost:5000/barber/services/${index}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  showMessage(data.msg || "Service deleted", "success");
  fetchServices();
};

// Employee Management
const employeeForm = document.getElementById("addEmployeeForm");
const employeeList = document.getElementById("employeeTableBody");

employeeForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("employeeName").value;
  const job = document.getElementById("employeeJob").value;
  const photoFile = document.getElementById("employeePhoto").files[0];
  const formData = new FormData();
  formData.append("name", name);
  formData.append("job", job);
  formData.append("photo", photoFile);

  try {
    const res = await fetch("http://localhost:5000/barber/employees/add", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    showMessage(data.msg || "Employee added!", "success");
    employeeForm.reset();
    previewImage.style.display = "none";
    fetchEmployees();
  } catch (error) {
    console.error("Error adding employee:", error);
    showMessage("Error adding employee", "danger");
  }
});

async function fetchEmployees() {
  try {
    const res = await fetch("http://localhost:5000/barber/employees", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderEmployees(data);
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
}

function renderEmployees(employees) {
  if (!employeeList) return;
  employeeList.innerHTML = "";
  employees.forEach((emp, index) => {
    employeeList.innerHTML += `
      <tr>
        <td><img src="${emp.photo}" height="50"/></td>
        <td>${emp.name}</td>
        <td>${emp.job}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editEmployee('${emp._id}', '${emp.name}', '${emp.job}', '${emp.photo}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${emp._id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

window.editEmployee = async (id, currentName, currentJob, currentPhoto) => {
  const name = prompt("Edit name:", currentName);
  const job = prompt("Edit job title:", currentJob);
  if (!name || !job) return;
  const res = await fetch(`http://localhost:5000/barber/employees/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, job, photo: currentPhoto })
  });
  const data = await res.json();
  showMessage(data.msg || "Updated!", "success");
  fetchEmployees();
};

window.deleteEmployee = async (id) => {
  const res = await fetch(`http://localhost:5000/barber/employees/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  showMessage(data.msg || "Deleted!", "success");
  fetchEmployees();
};

// Image preview
const dropZone = document.getElementById("dropZone");
const photoInput = document.getElementById("employeePhoto");
const previewImage = document.getElementById("previewImage");

dropZone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("bg-light");
});

dropZone?.addEventListener("dragleave", () => {
  dropZone.classList.remove("bg-light");
});

dropZone?.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("bg-light");
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith("image/")) {
    photoInput.files = files;
    showPreview(files[0]);
  }
});

photoInput?.addEventListener("change", () => {
  if (photoInput.files.length > 0) {
    showPreview(photoInput.files[0]);
  }
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
  };
  reader.readAsDataURL(file);
}




fetchBarberStatus();
fetchServices();
fetchEmployees();