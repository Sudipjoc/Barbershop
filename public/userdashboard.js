// userdashboard.js
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");
const socket = io("http://localhost:5000");

if (!token || !userId) {
  window.location.href = "/login.html";
}

document.getElementById("userWelcome").textContent = username || "User";

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: type === "success" ? "green" : "red",
  }).showToast();
}

async function fetchAppointments() {
  try {
    const res = await fetch(`http://localhost:5000/book/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const appointments = await res.json();
    renderAppointments(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
  }
}

function renderAppointments(appointments) {
  const list = document.getElementById("appointment-list");
  list.innerHTML = "";

  appointments.forEach(appt => {
    const div = document.createElement("div");
    div.className = "appointment-card";
    div.innerHTML = `
      <p><strong>Barber:</strong> ${appt.barber?.name || "N/A"}</p>
      <p><strong>Service:</strong> ${appt.service?.type || "N/A"}</p>
      <p><strong>Time:</strong> ${new Date(appt.bookingTime).toLocaleString()}</p>
      <p><strong>Status:</strong> ${appt.status}</p>
      <button onclick="cancelBooking('${appt._id}')" ${appt.status !== "Pending" ? "disabled" : ""}>Cancel</button>
      <button onclick="promptFeedback('${appt._id}')" ${appt.status !== "Completed" ? "disabled" : ""}>Feedback</button>
    `;
    list.appendChild(div);
  });
}

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;
  try {
    const res = await fetch(`http://localhost:5000/book/cancel/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    showToast(result.message);
    fetchAppointments();
  } catch (err) {
    console.error("Error cancelling booking:", err);
    showToast("Failed to cancel appointment", "error");
  }
}

function promptFeedback(appointmentId) {
  const feedback = prompt("Leave your review (optional):");
  const rating = prompt("Rate from 1 to 5:");
  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return showToast("Invalid rating.", "error");
  }
  submitReview(appointmentId, feedback || "", rating);
}

async function submitReview(bookingId, reviewText, rating) {
  try {
    const res = await fetch("http://localhost:5000/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, userId, reviewText, rating }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("✅ Review submitted!");
    } else {
      showToast(data.message || "Failed to submit review", "error");
    }
  } catch (err) {
    console.error("Review error:", err);
    showToast("Error submitting review.", "error");
  }
}

socket.on("shopStatusUpdate", ({ barberId, status }) => {
  showToast(`Barber ${barberId} shop is now ${status}`);
});

fetchAppointments();
