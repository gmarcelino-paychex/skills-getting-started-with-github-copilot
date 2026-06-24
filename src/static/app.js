document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeoutId;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showMessage(text, type) {
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
    }

    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function addParticipantToCard(activityName, email) {
    const encodedActivity = encodeURIComponent(activityName);
    const activityCard = activitiesList.querySelector(`.activity-card[data-activity="${encodedActivity}"]`);

    if (!activityCard) {
      return;
    }

    const participantsListElement = activityCard.querySelector(".participants-list");

    if (!participantsListElement) {
      return;
    }

    const alreadyVisible = [...participantsListElement.querySelectorAll(".participant-email")].some(
      (participantEmail) => participantEmail.textContent === email
    );

    if (alreadyVisible) {
      return;
    }

    const emptyStateElement = participantsListElement.querySelector(".participant-empty");

    if (emptyStateElement) {
      emptyStateElement.remove();
    }

    const participantItem = document.createElement("li");
    participantItem.className = "participant-item";

    const participantEmail = document.createElement("span");
    participantEmail.className = "participant-email";
    participantEmail.textContent = email;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-participant-btn";
    deleteButton.dataset.activity = encodedActivity;
    deleteButton.dataset.email = encodeURIComponent(email);
    deleteButton.title = "Unregister participant";
    deleteButton.setAttribute("aria-label", `Unregister ${email}`);
    deleteButton.innerHTML = "&#128465;";

    participantItem.appendChild(participantEmail);
    participantItem.appendChild(deleteButton);
    participantsListElement.appendChild(participantItem);

    const availabilityElement = activityCard.querySelector(".availability-text");

    if (availabilityElement) {
      const currentText = availabilityElement.textContent || "";
      const match = currentText.match(/(\d+)\s+spots left/);

      if (match) {
        const spotsLeft = Math.max(0, Number(match[1]) - 1);
        availabilityElement.textContent = `Availability: ${spotsLeft} spots left`;
      }
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = encodeURIComponent(name);

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = details.participants.length
          ? details.participants
              .map((participant) => {
                const safeParticipant = escapeHtml(participant);
                const encodedParticipant = encodeURIComponent(participant);
                const encodedActivity = encodeURIComponent(name);
                return `
                  <li class="participant-item">
                    <span class="participant-email">${safeParticipant}</span>
                    <button
                      type="button"
                      class="delete-participant-btn"
                      data-activity="${encodedActivity}"
                      data-email="${encodedParticipant}"
                      title="Unregister participant"
                      aria-label="Unregister ${safeParticipant}"
                    >&#128465;</button>
                  </li>
                `;
              })
              .join("")
          : '<li class="participant-empty">No participants yet</li>';

        const safeName = escapeHtml(name);
        const safeDescription = escapeHtml(details.description);
        const safeSchedule = escapeHtml(details.schedule);

        activityCard.innerHTML = `
          <h4>${safeName}</h4>
          <p>${safeDescription}</p>
          <p><strong>Schedule:</strong> ${safeSchedule}</p>
          <p class="availability-text"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant-btn");

    if (!deleteButton) {
      return;
    }

    const activity = decodeURIComponent(deleteButton.dataset.activity || "");
    const email = decodeURIComponent(deleteButton.dataset.email || "");

    if (!activity || !email) {
      showMessage("Could not unregister participant.", "error");
      return;
    }

    deleteButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    } finally {
      deleteButton.disabled = false;
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        addParticipantToCard(activity, email);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
