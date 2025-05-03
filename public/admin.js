document.addEventListener("DOMContentLoaded", () => {
  const dashboardLink = document.getElementById("dashboard-link");
  const barbersLink = document.getElementById("barbers-link");
  const usersLink = document.getElementById("users-link");
  const appointmentsLink = document.getElementById("appointments-link");
  const servicesLink = document.getElementById("services-link");
  const logoutBtn = document.getElementById("logout-btn");

  const statsSection = document.getElementById("stats-section");
  const appointmentsSection = document.getElementById("appointments-section");
  const barberSection = document.getElementById("barber-section");
  const userSection = document.getElementById("user-section");
  const servicesSection = document.getElementById("services-section");

  const addBarberBtn = document.getElementById("add-barber-btn");
  const barberFormContainer = document.getElementById("barber-form-container");
  const barberForm = document.getElementById("barber-form");

  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/login.html");

  const hideAllSections = () => {
    statsSection.style.display = "none";
    appointmentsSection.style.display = "none";
    barberSection.style.display = "none";
    userSection.style.display = "none";
    servicesSection.style.display = "none";
  };

  const showDashboard = () => {
    hideAllSections();
    statsSection.style.display = "grid";
    appointmentsSection.style.display = "block";
    fetchStats();
    fetchAppointments();
  };

  const showBarbers = () => {
    hideAllSections();
    barberSection.style.display = "block";
    fetchBarbers();
  };

  const showUsers = () => {
    hideAllSections();
    userSection.style.display = "block";
    fetchUsers();
  };

  const showServices = () => {
    hideAllSections();
    servicesSection.style.display = "block";
    fetchServices();
  };

  dashboardLink.onclick = showDashboard;
  appointmentsLink.onclick = showDashboard;
  barbersLink.onclick = showBarbers;
  usersLink.onclick = showUsers;
  servicesLink.onclick = showServices;

  logoutBtn.onclick = () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      window.location.href = "login.html";
    }
  };

  addBarberBtn.onclick = () => {
    barberFormContainer.style.display = "block";
    addBarberBtn.style.display = "none";
  };

  barberForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("barber-name").value);
    formData.append("email", document.getElementById("barber-email").value);
    formData.append("password", document.getElementById("barber-password").value);
    formData.append("location", document.getElementById("barber-location").value);
    formData.append("image", document.getElementById("barber-image").files[0]);

    try {
      const res = await fetch("http://localhost:5000/admin/create-barber", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      alert(data.msg);
      barberForm.reset();
      barberFormContainer.style.display = "none";
      addBarberBtn.style.display = "block";
      fetchBarbers();
    } catch (err) {
      console.error("Error creating barber:", err);
      alert("Failed to create barber.");
    }
  };

  async function fetchStats() {
    try {
      const statsRes = await fetch("http://localhost:5000/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stats = await statsRes.json();

      const revenueRes = await fetch("http://localhost:5000/admin/revenue", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const revenue = await revenueRes.json();

      document.getElementById("total-users").textContent = stats.totalUsers;
      document.getElementById("total-barbers").textContent = stats.totalBarbers;
      document.getElementById("total-appointments").textContent = stats.totalAppointments;
      document.getElementById("total-revenue").textContent = revenue.totalRevenue;
    } catch (err) {
      console.error("Error fetching stats/revenue:", err);
    }
  }

  async function fetchAppointments() {
    try {
      const res = await fetch("http://localhost:5000/book", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bookings = await res.json();
      if (!Array.isArray(bookings)) throw new Error("Invalid bookings format");

      const list = document.getElementById("appointment-list");
      list.innerHTML = "";

      bookings.forEach(b => {
        list.innerHTML += `<tr>
          <td>${b.name}</td>
          <td>${b.barber?.name || b.barber}</td>
          <td>${b.service?.type || b.service}</td>
          <td>${new Date(b.bookingTime).toLocaleString()}</td>
          <td>${b.paymentMethod}</td>
        </tr>`;
      });
    } catch (err) {
      console.error("Error loading appointments:", err);
    }
  }

  async function fetchBarbers() {
    try {
      const res = await fetch("http://localhost:5000/admin/barbers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const barbers = await res.json();

      const list = document.getElementById("barber-list");
      list.innerHTML = "";

      barbers.forEach(b => {
        list.innerHTML += `<tr>
          <td><img src="${b.image || 'default.png'}" style="width:50px;height:50px"></td>
          <td>${b.name}</td>
          <td>${b.email}</td>
          <td>${b.location}</td>
          <td><button onclick="deleteBarber('${b._id}')">Delete</button></td>
        </tr>`;
      });
    } catch (err) {
      console.error("Error fetching barbers:", err);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("http://localhost:5000/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = await res.json();
      const list = document.getElementById("user-list");
      list.innerHTML = "";
      users.forEach(u => {
        list.innerHTML += `<tr>
          <td>${u.username}</td>
          <td>${u.email}</td>
          <td><button onclick="deleteUser('${u._id}')">Delete</button></td>
        </tr>`;
      });
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }

  async function fetchServices() {
    const res = await fetch("http://localhost:5000/admin/services");
    const services = await res.json();
    const container = document.getElementById("service-list");
    container.innerHTML = "";
    services.forEach((s, i) => {
      container.innerHTML += `
        <div class="card">
          <h3>${s.type}</h3>
          <label>Price: NPR</label>
          <input type="number" value="${s.price}" id="price-${i}" />
          <button onclick="updateService('${s.type}', ${i})">Update</button>
        </div>`;
    });
  }

  window.updateService = async (type, i) => {
    const price = document.getElementById(`price-${i}`).value;
    const res = await fetch("http://localhost:5000/admin/services/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, price })
    });
    const data = await res.json();
    alert(data.message);
    fetchServices();
  };

  // ✅ Expose delete functions globally
  window.deleteBarber = async (id) => {
    const res = await fetch(`http://localhost:5000/admin/delete-barber/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    alert(data.msg);
    fetchBarbers();
  };

  window.deleteUser = async (id) => {
    const res = await fetch(`http://localhost:5000/admin/delete-user/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    alert(data.msg);
    fetchUsers();
  };

  // Init
  showDashboard();
});
