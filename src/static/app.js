document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function setMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = "message";

    if (type === "success") {
      messageDiv.classList.add("success");
    } else if (type === "error") {
      messageDiv.classList.add("error");
    } else if (type === "info") {
      messageDiv.classList.add("info");
    }

    messageDiv.classList.remove("hidden");
  }

  function hideMessage() {
    messageDiv.classList.add("hidden");
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        const descriptionLabel = document.createElement("strong");
        descriptionLabel.textContent = "Description:";
        description.appendChild(descriptionLabel);
        description.appendChild(document.createTextNode(` ${details.description}`));

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule:";
        schedule.appendChild(scheduleLabel);
        schedule.appendChild(document.createTextNode(` ${details.schedule}`));

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability:";
        availability.appendChild(availabilityLabel);
        availability.appendChild(document.createTextNode(` ${spotsLeft} spots left`));

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant-empty";
          emptyItem.textContent = "No participants yet.";
          participantsList.appendChild(emptyItem);
        } else {
          participants.forEach((email) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.title = `Unregister ${email}`;
            removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            removeButton.textContent = "✕";
            removeButton.addEventListener("click", async () => {
              await unregisterParticipant(name, email);
            });

            participantItem.appendChild(participantEmail);
            participantItem.appendChild(removeButton);
            participantsList.appendChild(participantItem);
          });
        }

        participantsSection.appendChild(participantsHeading);
        participantsSection.appendChild(participantsList);

        activityCard.appendChild(title);
        activityCard.appendChild(description);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

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

  async function unregisterParticipant(activityName, email) {
    const encodedActivity = encodeURIComponent(activityName);
    const encodedEmail = encodeURIComponent(email);

    try {
      const response = await fetch(
        `/activities/${encodedActivity}/signup?email=${encodedEmail}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(result.message || `Removed ${email} from ${activityName}.`, "success");
        await fetchActivities();
      } else {
        setMessage(result.detail || `Could not remove ${email} from ${activityName}.`, "error");
      }

      setTimeout(hideMessage, 5000);
    } catch (error) {
      setMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
      setTimeout(hideMessage, 5000);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!activity || !email) {
      setMessage("Please select an activity and enter a valid email.", "error");
      setTimeout(hideMessage, 5000);
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage(result.message || `Signed up ${email} for ${activity}.`, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred.", "error");
      }

      setTimeout(hideMessage, 5000);
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
      setTimeout(hideMessage, 5000);
    }
  });

  fetchActivities();
});
