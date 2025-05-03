document.addEventListener("DOMContentLoaded", () => {
    // Retrieve the username from localStorage
    const username = localStorage.getItem("username");
    if (username) {
        document.getElementById("username").textContent = `Welcome, ${username}`;  // Display username
    } else {
        document.getElementById("username").textContent = "Welcome, Guest";  // Default if no username found
    }

    const urlParams = new URLSearchParams(window.location.search);
    const barberId = urlParams.get("barberId");

    if (barberId) {
        fetchBarberDetails(barberId);
        fetchReviews(barberId); // Fetch reviews when the page loads
    } else {
        alert("No barber found");
    }
});

// Function to fetch barber details
function fetchBarberDetails(barberId) {
    fetch(`http://localhost:5000/barber/${barberId}`)  // API endpoint to fetch barber details
        .then(response => response.json())
        .then(barber => {
            // Display barber details in the HTML elements
            document.getElementById("barber-name").textContent = barber.name;
            document.getElementById("barber-location").textContent = `Location: ${barber.location}`;
            document.getElementById("barber-status").textContent = `Status: ${barber.shopStatus === 'open' ? 'Open' : 'Closed'}`;
            document.getElementById("appointments-count").textContent = `Appointments: ${barber.appointmentsCount || 0}`;

            // Set barber image or default image if not available
            document.getElementById("barber-image").src = barber.image ? barber.image : 'default-image.jpg';

            // Handle Book Appointment button
            const bookButton = document.getElementById("book-btn");
            bookButton.addEventListener("click", function() {
                window.location.href = `booking.html?barberId=${barberId}`; // Redirect to booking page
            });
        })
        .catch(error => console.error("Error fetching barber details:", error));
}

// Function to fetch reviews for a barber
function fetchReviews(barberId) {
    fetch(`http://localhost:5000/reviews?barberId=${barberId}`)  // API endpoint to fetch reviews
        .then(response => response.json())
        .then(reviews => {
            const reviewsList = document.getElementById("reviews-list");
            reviewsList.innerHTML = "";  // Clear previous reviews

            reviews.forEach(review => {
                const reviewItem = document.createElement("li");
                reviewItem.innerHTML = `${review.user.name}: ${review.text} <strong>Rating: ${review.rating}</strong>`;
                reviewsList.appendChild(reviewItem);
            });
        })
        .catch(error => console.error("Error fetching reviews:", error));
}

// Function to submit a new review
const submitReviewBtn = document.getElementById("submit-review-btn");
submitReviewBtn.addEventListener("click", function() {
    const reviewText = document.getElementById("review-text").value.trim();
    const rating = document.querySelector('input[name="rating"]:checked');  // Get selected radio button for rating
    const userId = localStorage.getItem("userId");  // Assuming user ID is stored in localStorage

    if (!reviewText || !rating) {
        alert("Please write a review and select a rating.");
        return;
    }

    const barberId = new URLSearchParams(window.location.search).get("barberId");
    const selectedRating = rating.value;

    // Send review to the backend
    fetch(`http://localhost:5000/reviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId,
            barberId,
            reviewText,
            rating: selectedRating,  // Include the selected rating in the request
        }),
    })
        .then(response => response.json())
        .then(data => {
            alert("Review submitted successfully!");
            fetchReviews(barberId);  // Refresh the reviews list
            document.getElementById("review-text").value = "";  // Clear the input field
            // Uncheck all radio buttons
            document.querySelectorAll('input[name="rating"]').forEach(input => input.checked = false);
        })
        .catch(error => {
            console.error("Error submitting review:", error);
            alert("Failed to submit review.");
        });
});


// Function to fetch reviews done by the user
function fetchUserReviews(userId) {
    fetch(`http://localhost:5000/reviews/user/${userId}`)  // Assuming the endpoint is like /reviews/user/:userId
        .then(response => response.json())
        .then(reviews => {
            const reviewsList = document.getElementById("user-reviews-list");
            reviewsList.innerHTML = "";  // Clear any previous reviews

            if (reviews.length === 0) {
                reviewsList.innerHTML = "<li>No reviews yet.</li>";
                return;
            }

            // Loop through the reviews and append them to the DOM
            reviews.forEach(review => {
                const reviewItem = document.createElement("li");
                reviewItem.innerHTML = `
                    <p><strong>Barber: ${review.barber.name}</strong></p>
                    <p>Review: ${review.text}</p>
                    <p>Rating: ${review.rating} Stars</p>
                    <p>Date: ${new Date(review.createdAt).toLocaleDateString()}</p>
                    <hr>
                `;
                reviewsList.appendChild(reviewItem);
            });
        })
        .catch(error => {
            console.error("Error fetching user reviews:", error);
            alert("Failed to load your reviews.");
        });
}


fetch('/api/services')
        .then(response => response.json())
        .then(services => {
            const container = document.getElementById('services-container');
            services.forEach(service => {
                container.innerHTML += `
                    <div class="col-lg-4 col-md-6 text-center mb-3">
                        <div class="service-wrap">
                            <div class="service-icon">
                                <i class="${service.icon}"></i>
                            </div>
                            <h4>${service.title}</h4>
                            <p>${service.description}</p>
                            <a href="${service.link}">Read More</a>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => console.error('Error loading services:', error));

// Logout Functionality
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", function() {
    if (confirm("Are you sure you want to log out?")) {
        // Clear the stored username and redirect to login
        localStorage.removeItem("username");
        localStorage.removeItem("userId");  // Also remove user ID
        window.location.href = "login.html"; // Redirect to login page
    }
});
