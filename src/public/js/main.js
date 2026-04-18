// Toast container 
const toastContainer = document.createElement("div");
toastContainer.className = "lumio-toast-container";
document.body.appendChild(toastContainer);

window.showToast = (type, message, duration = 4000) => {
  const icons = {
    success: "bi-check-circle-fill",
    error: "bi-x-circle-fill",
    info: "bi-info-circle-fill",
  };
  const toast = document.createElement("div");
  toast.className = `lumio-toast lumio-toast--${type}`;
  toast.innerHTML = `
    <i class="bi ${icons[type] || icons.info} lumio-toast__icon"></i>
    <span class="lumio-toast__msg">${message}</span>
    <button class="lumio-toast__close" aria-label="Close"><i class="bi bi-x-lg"></i></button>
  `;
  toastContainer.appendChild(toast);

  const remove = () => {
    toast.style.animation = "slideOutRight .25s ease forwards";
    setTimeout(() => toast.remove(), 250);
  };

  toast.querySelector(".lumio-toast__close").addEventListener("click", remove);
  setTimeout(remove, duration);
};

window.lumioConfirm = ({
  title,
  message,
  confirmLabel = "Confirm",
  confirmClass = "btn--primary",
  cancelLabel = "Cancel",
  icon = "⚠️",
} = {}) => {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "lumio-overlay";
    overlay.innerHTML = `
      <div class="lumio-modal">
        <div class="lumio-modal__icon">${icon}</div>
        <h3 class="lumio-modal__title">${title || "Are you sure?"}</h3>
        <p class="lumio-modal__message">${message || ""}</p>
        <div class="lumio-modal__actions">
          <button class="btn btn--ghost" id="lumio-cancel-btn">${cancelLabel}</button>
          <button class="btn ${confirmClass}" id="lumio-confirm-btn">${confirmLabel}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.style.animation = "fadeIn .15s ease reverse";
      setTimeout(() => overlay.remove(), 150);
      resolve(result);
    };

    overlay
      .querySelector("#lumio-confirm-btn")
      .addEventListener("click", () => close(true));
    overlay
      .querySelector("#lumio-cancel-btn")
      .addEventListener("click", () => close(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
  });
};

// Navbar dropdown toggle 
const navbarUserBtn = document.querySelector("#navbar-user-btn");
const navbarDropdown = document.querySelector("#navbar-dropdown");

if (navbarUserBtn && navbarDropdown) {
  // Toggle on avatar click
  navbarUserBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navbarDropdown.classList.toggle("open");
  });

  // Keep open when hovering inside dropdown
  navbarDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Close when clicking anywhere outside
  document.addEventListener("click", () => {
    navbarDropdown.classList.remove("open");
  });
}

const showAlert = (type, msg) => {
  const box = document.querySelector("#alert-box");
  if (!box) return;
  box.innerHTML = `<div class="alert alert--${type}">${msg}</div>`;
  setTimeout(() => {
    box.innerHTML = "";
  }, 5000);
};

const setLoading = (btn, loading) => {
  const label = btn.querySelector("span:first-child");
  const spinner = btn.querySelector(".btn__spinner");
  if (!label) return;
  btn.disabled = loading;
  label.hidden = loading;
  if (spinner) spinner.hidden = !loading;
};

// Login 
const loginBtn = document.querySelector("#login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    if (!email || !password)
      return showAlert("error", "Please fill in all fields.");

    setLoading(loginBtn, true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed.");
      showAlert("success", "Logged in! Redirecting…");
      setTimeout(() => window.location.assign("/dashboard"), 1000);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(loginBtn, false);
    }
  });
}

// Signup 
const signupBtn = document.querySelector("#signup-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const name = document.querySelector("#name").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const passwordConfirm = document.querySelector("#passwordConfirm").value;
    const role =
      document.querySelector('input[name="role"]:checked')?.value || "student";

    if (!name || !email || !password || !passwordConfirm) {
      return showAlert("error", "Please fill in all fields.");
    }

    setLoading(signupBtn, true);
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, passwordConfirm, role }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed.");
      showAlert("success", "Account created! Redirecting…");
      setTimeout(() => window.location.assign("/dashboard"), 1000);
    } catch (err) {
      showAlert("error", err.message);
    } finally {
      setLoading(signupBtn, false);
    }
  });
}

// Logout 
const logoutBtns = document.querySelectorAll("#logout-btn");
logoutBtns.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.assign("/");
    } catch {
      window.location.assign("/");
    }
  });
});

// Show/hide password toggles (signup & login pages) 
document.querySelectorAll(".input-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    const icon = btn.querySelector("i");
    if (!input || !icon) return;
    if (input.type === "password") {
      input.type = "text";
      icon.className = "bi bi-eye-slash";
    } else {
      input.type = "password";
      icon.className = "bi bi-eye";
    }
  });
});

// Smooth page transitions 
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href');
  // Skip: external URLs, hash-only anchors, javascript:, open-in-new-tab
  if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('http') ||
    href.startsWith('//') ||
    href.startsWith('javascript') ||
    href.startsWith('mailto') ||
    link.target === '_blank' ||
    link.download
  ) return;

  e.preventDefault();
  const content = document.querySelector('.main-content');
  if (content) {
    content.classList.add('page-leaving');
    setTimeout(() => window.location.assign(href), 180);
  } else {
    window.location.assign(href);
  }
});
