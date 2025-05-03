document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token") || null;

  const barberSelect = document.getElementById("barber_select");
  const serviceSelect = document.getElementById("service_select");
  const appointmentForm = document.getElementById("appointment_form");
  const msgStatus = document.getElementById("msg-status");
  const areaInput = document.getElementById("user_area");
  const appointmentTimeInput = document.getElementById("appointment_time");

  flatpickr("#appointment_time", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    defaultHour: 10,
    defaultMinute: 0
  });

  async function loadBarbersAndServices() {
    try {
      const res = await fetch("http://localhost:5000/barber/barbers");
      const barbers = await res.json();

      barberSelect.innerHTML = '<option value="">Select Barber</option>';
      serviceSelect.innerHTML = '<option value="">Select Service</option>';

      barbers.forEach(barber => {
        const option = document.createElement("option");
        option.value = barber._id;
        option.text = `${barber.name} - ${barber.location}`;
        option.dataset.location = barber.location;
        barberSelect.appendChild(option);
      });

      barberSelect.addEventListener("change", () => {
        const selectedBarber = barbers.find(b => b._id === barberSelect.value);
        renderServices(selectedBarber?.services || []);
        areaInput.value = selectedBarber?.location || "";
      });
    } catch (error) {
      showMsg("Error loading barbers", "danger");
    }
  }

  function renderServices(services) {
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    services.forEach(service => {
      const option = document.createElement("option");
      option.value = `${service.type}|${service.price}`;
      option.textContent = `${service.type} - NPR ${service.price}`;
      serviceSelect.appendChild(option);
    });
  }

  function showMsg(msg, type = "success") {
    msgStatus.textContent = msg;
    msgStatus.className = `alert alert-${type}`;
    msgStatus.style.display = "block";
    setTimeout(() => {
      msgStatus.style.display = "none";
    }, 3000);
  }

  appointmentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("user_name").value;
    const email = document.getElementById("user_email").value;
    const phone = document.getElementById("user_phone").value;
    const area = areaInput.value;
    const [service, price] = serviceSelect.value.split("|");
    const barberId = barberSelect.value;
    const bookingTime = appointmentTimeInput.value;
    const paymentMethod = document.getElementById("payment_method").value;

    try {
      const res = await fetch("http://localhost:5000/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          bookingTime,
          service,
          price: parseFloat(price),
          area,
          barberId,
          paymentMethod
        })
      });

      const data = await res.json();
      if (res.ok) {
        showMsg(data.msg || "Appointment booked successfully");
        appointmentForm.reset();
        areaInput.value = "";
      } else {
        showMsg(data.msg || "Failed to book appointment", "danger");
      }
    } catch (error) {
      showMsg("Failed to book appointment", "danger");
    }
  });

  loadBarbersAndServices();
});