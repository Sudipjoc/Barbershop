let slideIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  setupSlideshow();
  setupNavbar();
  setupHamburger();
  setupSmoothScroll();
  setupLogout();
  fetchUsername();
  setupDropdown();
  setupEnterKeyForChat();
  fetchAndRenderBarbers();
});

/* ================== SLIDESHOW ================== */
function setupSlideshow() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  if (!slides.length) return;

  function showSlides() {
    slides.forEach((slide) => (slide.style.display = "none"));
    dots.forEach((dot) => dot.classList.remove("active"));

    slideIndex = (slideIndex % slides.length) + 1;

    if (slides[slideIndex - 1]) slides[slideIndex - 1].style.display = "block";
    if (dots[slideIndex - 1]) dots[slideIndex - 1].classList.add("active");

    setTimeout(showSlides, 3000);
  }

  showSlides();
}

/* ================== NAVBAR ================== */
function setupNavbar() {
  const hamburger = document.createElement("div");
  hamburger.classList.add("hamburger");
  hamburger.innerHTML = `<span></span><span></span><span></span>`;
  document.querySelector(".navbar-container")?.appendChild(hamburger);
}

/* ================== HAMBURGER MENU ================== */
function setupHamburger() {
  const hamburger = document.querySelector(".hamburger");
  const menu = document.querySelector(".menu-items");

  if (hamburger && menu) {
    hamburger.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }
}

/* ================== SMOOTH SCROLL ================== */
function setupSmoothScroll() {
  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

/* ================== CHAT SYSTEM ================== */
function toggleChat() {
  const chatContainer = document.querySelector(".chat-container");
  if (chatContainer) chatContainer.classList.toggle("active");
}

function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input?.value.trim();
  if (!message) return;

  const msgBox = document.getElementById("chat-messages");

  const userMsg = document.createElement("div");
  userMsg.className = "message customer";
  userMsg.textContent = message;
  msgBox.appendChild(userMsg);

  input.value = "";

  setTimeout(() => {
    const reply = document.createElement("div");
    reply.className = "message barber";
    reply.textContent = "Thanks for reaching out!";
    msgBox.appendChild(reply);
    msgBox.scrollTop = msgBox.scrollHeight;
  }, 1000);
}

function setupEnterKeyForChat() {
  const input = document.getElementById("message-input");
  if (!input) return;

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

/* ================== PROFILE DROPDOWN ================== */
function setupDropdown() {
  const userDropdown = document.getElementById("userDropdown");
  const menu = document.getElementById("dropdownMenu");

  if (userDropdown && menu) {
    // Toggle on click
    userDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
    });

    // Close on outside click
    document.addEventListener("click", () => {
      if (menu.classList.contains("show")) {
        menu.classList.remove("show");
      }
    });

    // Close on mobile tap
    document.addEventListener("touchstart", (e) => {
      if (!userDropdown.contains(e.target)) {
        menu.classList.remove("show");
      }
    });
  }
}

/* ================== LOGOUT FUNCTION ================== */
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const confirmLogout = confirm("Are you sure you want to logout?");
      if (confirmLogout) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "login.html";
      }
    });
  }
}

/* ================== FETCH LOGGED-IN USER ================== */
async function fetchUsername() {
  const userEl = document.getElementById("username");
  const token = localStorage.getItem("token");

  if (!token || !userEl) {
    if (userEl) userEl.textContent = "User";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch user");

    const data = await response.json();
    const fullName = `${data.firstName} ${data.lastName}`;
    userEl.textContent = fullName;
    localStorage.setItem("username", fullName);
  } catch (error) {
    console.error("Error fetching user:", error);
    if (userEl) userEl.textContent = "User";
  }
}

/* ================== FETCH & DISPLAY BARBERS ================== */
function fetchAndRenderBarbers() {
  fetch("http://localhost:5000/barbers")
    .then((res) => {
      if (!res.ok) throw new Error("Barber API not reachable");
      return res.json();
    })
    .then((barbers) => {
      const barberList = document.getElementById("barber-list");

      if (!Array.isArray(barbers) || barbers.length === 0) {
        barberList.innerHTML = "<p>No barbers available at the moment.</p>";
        return;
      }

      barberList.innerHTML = ""; // Clear previous entries

      barbers.forEach((barber) => {
        const card = document.createElement("div");
        card.className = "service-card";

        const status = barber.shopStatus === "open" ? "🟢 Open" : "🔴 Closed";
        const services = Array.isArray(barber.services)
          ? barber.services.map((s) => `<li><strong>${s.name}</strong>: NPR ${s.price}</li>`).join("")
          : "<li>No services listed</li>";

        const location = barber.location || "Not specified";

        card.innerHTML = `
          <h3>${barber.name}</h3>
          <p><strong>Location:</strong> ${location}</p>
          <p>Status: ${status}</p>
          <ul>${services}</ul>
          <button class="login-redirect-btn">View Details</button>
        `;

        // Save barber info to localStorage and go to booking
        card.querySelector(".login-redirect-btn").addEventListener("click", () => {
          localStorage.setItem("selectedBarber", JSON.stringify({
            name: barber.name,
            location: barber.location
          }));
          window.location.href = "booking.html";
        });

        barberList.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Error fetching barbers:", err);
      const barberList = document.getElementById("barber-list");
      if (barberList) {
        barberList.innerHTML =
          "<p>Error loading barbers. Please try again later.</p>";
      }
    });
}
