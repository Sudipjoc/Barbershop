let allBarbers = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchBarbers();
  document.getElementById("logout-btn")?.addEventListener("click", logoutUser);

  const searchInput = document.getElementById("search-location");
  const suggestionsList = document.getElementById("location-suggestions");

  searchInput.addEventListener("input", () => showSuggestions(searchInput.value));
  suggestionsList.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      searchInput.value = e.target.textContent;
      suggestionsList.innerHTML = "";
      suggestionsList.style.display = "none";
      filterBarbersByLocation(searchInput.value);
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      suggestionsList.innerHTML = "";
      suggestionsList.style.display = "none";
      filterBarbersByLocation(searchInput.value);
    }
  });
});

async function fetchBarbers() {
  try {
    const response = await fetch("http://localhost:5000/barbers");
    const barbers = await response.json();
    allBarbers = barbers;
    renderBarbers(barbers);
  } catch (error) {
    console.error("Error fetching barbers:", error);
  }
}

async function renderBarbers(barbers) {
  const barberGrid = document.getElementById("barber-grid");
  barberGrid.innerHTML = "";

  const loggedInBarberId = localStorage.getItem("userId");

  for (const barber of barbers) {
    const card = document.createElement("div");
    card.classList.add("barber-card");

    let appointmentCount = 0;
    try {
      const res = await fetch(`http://localhost:5000/barber/${barber._id}/appointments`);
      const appointments = await res.json();
      appointmentCount = appointments.length || 0;
    } catch (err) {
      console.error("Appointment fetch error:", err);
    }

    const services = Array.isArray(barber.services) && barber.services.length > 0
      ? barber.services.map(s => `<li><strong>${s.name}</strong>: NPR ${s.price}</li>`).join("")
      : "<li>No services listed</li>";

    card.innerHTML = `
      <img src="${barber.image || 'default-image.jpg'}" alt="${barber.name}" />
      <h3>${barber.name}</h3>
      <p><strong>Location:</strong> ${barber.location || "N/A"}</p>
      <p><strong>Status:</strong> ${barber.shopStatus === "open" ? "🟢 Open" : "🔴 Closed"}</p>
      <p><strong>Appointments:</strong> ${appointmentCount}</p>
      <p><strong>Availability:</strong> <span id="availability-${barber._id}">${barber.availabilityStatus || "N/A"}</span></p>
      <div class="price-list">
        <h4>Services:</h4>
        <ul>${services}</ul>
      </div>
    `;

    // Show toggle only if it's the logged-in barber
    if (barber._id === loggedInBarberId) {
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = "Toggle Availability";
      toggleBtn.className = "toggle-btn";
      toggleBtn.addEventListener("click", () => toggleAvailability(barber._id, barber.availabilityStatus));
      card.appendChild(toggleBtn);
    }

    if (barber.shopStatus !== 'open') {
      card.style.pointerEvents = "none";
      card.style.opacity = "0.6";
    } else {
      card.addEventListener("click", () => {
        window.location.href = `barber-detail.html?barberId=${barber._id}`;
      });
    }

    barberGrid.appendChild(card);
  }
}

async function toggleAvailability(barberId, currentStatus) {
  const newStatus = currentStatus === "Available" ? "Busy" : "Available";

  try {
    const res = await fetch("http://localhost:5000/barber/me/availability", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ availabilityStatus: newStatus })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById(`availability-${barberId}`).textContent = data.availabilityStatus;
      alert("Availability status updated!");
      fetchBarbers(); // Refresh the grid to reflect changes
    } else {
      alert(data.message || "Failed to update availability.");
    }
  } catch (error) {
    console.error("Error updating availability:", error);
  }
}

function showSuggestions(input) {
  const list = document.getElementById("location-suggestions");
  const locations = [...new Set(allBarbers.map(b => b.location).filter(Boolean))];

  const filtered = locations.filter(loc =>
    loc.toLowerCase().startsWith(input.toLowerCase())
  );

  if (input.trim() === "" || filtered.length === 0) {
    list.style.display = "none";
    list.innerHTML = "";
    return;
  }

  list.innerHTML = filtered.map(loc => `<li>${loc}</li>`).join("");
  list.style.display = "block";
}

function filterBarbersByLocation(searchTerm) {
  const matched = allBarbers.filter(b =>
    b.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderBarbers(matched);
}

function logoutUser() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.clear();
    window.location.href = "login.html";
  }
}
