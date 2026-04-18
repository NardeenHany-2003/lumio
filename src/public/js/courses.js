const grid = document.querySelector("#courses-grid");
const countEl = document.querySelector("#results-count");
const pagination = document.querySelector("#pagination");

let currentPage = 1;
const limit = 9;

const buildQuery = () => {
  const params = new URLSearchParams();
  params.set("page", currentPage);
  params.set("limit", limit);

  const category = document.querySelector("#filter-category")?.value;
  const level = document.querySelector("#filter-level")?.value;
  const sort = document.querySelector("#filter-sort")?.value;
  const search = document.querySelector("#search-input")?.value.trim();
  const price = document.querySelector(
    'input[name="price-filter"]:checked',
  )?.value;

  if (category) params.set("category", category);
  if (level) params.set("level", level);
  if (sort) params.set("sort", sort);
  if (search) params.set("search", search);
  if (price === "free") params.set("price", 0);
  if (price === "paid") params.set("price[gt]", 0);

  return params.toString();
};

const renderCourses = (courses) => {
  if (!courses.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem; color:#6b7280;">
        <p style="font-size:2.5rem">🔍</p>
        <p>No courses found. Try adjusting your filters.</p>
      </div>`;
    return;
  }

  grid.innerHTML = courses
    .map(
      (c) => `
    <div class="course-card">
      <a class="course-card__thumb-link" href="/courses/${c.slug}">
        <img class="course-card__thumb" src="/img/${c.thumbnail}" alt="${c.title}" loading="lazy">
        <span class="course-card__level">${c.level}</span>
      </a>
      <div class="course-card__body">
        <a class="course-card__title" href="/courses/${c.slug}">${c.title}</a>
        <div class="course-card__meta">
          <div class="course-card__rating">
            <span class="stars">★</span>
            <span>${c.ratingsAverage > 0 ? c.ratingsAverage.toFixed(1) : "New"}</span>
          </div>
          <span class="course-card__dot">·</span>
          <span>${c.totalStudents} students</span>
        </div>
        <div class="course-card__footer">
          <div class="course-card__instructor">
            <img src="/img/${c.instructor.photo}" alt="${c.instructor.name}">
            <span>${c.instructor.name}</span>
          </div>
          <span class="course-card__price">${c.price === 0 ? "Free" : "$" + c.price}</span>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};

const renderPagination = (totalPages) => {
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }
  let html = `<button class="pagination__btn" id="prev-btn" ${currentPage === 1 ? "disabled" : ""}>← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="pagination__btn" id="next-btn" ${currentPage === totalPages ? "disabled" : ""}>Next →</button>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = +btn.dataset.page;
      fetchCourses();
    });
  });
  document.querySelector("#prev-btn")?.addEventListener("click", () => {
    currentPage--;
    fetchCourses();
  });
  document.querySelector("#next-btn")?.addEventListener("click", () => {
    currentPage++;
    fetchCourses();
  });
};

const fetchCourses = async () => {
  grid.innerHTML = '<div class="spinner">Loading courses…</div>';
  try {
    const res = await fetch(`/api/v1/courses?${buildQuery()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const courses = data.data.courses;
    const p = data.pagination;
    countEl.textContent = `${p.total} course${p.total !== 1 ? "s" : ""} found`;
    renderCourses(courses);
    renderPagination(p.totalPages);
  } catch (err) {
    grid.innerHTML = `<p style="color:#ef4444; padding:1rem;">Error loading courses: ${err.message}</p>`;
  }
};

// Event listeners 
document.querySelector("#apply-filters")?.addEventListener("click", () => {
  currentPage = 1;
  fetchCourses();
});
document.querySelector("#reset-filters")?.addEventListener("click", () => {
  document.querySelector("#filter-category").value = "";
  document.querySelector("#filter-level").value = "";
  document.querySelector("#filter-sort").value = "-ratingsAverage";
  document.querySelector("#search-input").value = "";
  document.querySelector('input[name="price-filter"][value=""]').checked = true;
  currentPage = 1;
  fetchCourses();
});

let searchTimeout;
document.querySelector("#search-input")?.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage = 1;
    fetchCourses();
  }, 500);
});

// Apply URL params on load
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("category")) {
  const sel = document.querySelector("#filter-category");
  if (sel) sel.value = urlParams.get("category");
}

fetchCourses();
