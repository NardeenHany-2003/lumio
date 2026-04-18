const courseSlug = window.location.pathname.split('/').pop();
let resolvedCourseId = null;

//  Fetch course data once, share across features
const getCourseData = async () => {
  const res = await fetch(`/api/v1/courses/${courseSlug}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  resolvedCourseId = data.data.course._id;
  return data.data;
};

// Enroll / Buy
const enrollBtn = document.querySelector('#enroll-btn');
if (enrollBtn) {
  enrollBtn.addEventListener('click', async () => {
    const courseId = enrollBtn.dataset.courseId;
    const price = Number(enrollBtn.dataset.coursePrice);

    enrollBtn.disabled = true;

    if (price === 0) {
      // Free course
      enrollBtn.textContent = 'Enrolling…';
      try {
        const res = await fetch(`/api/v1/courses/${courseId}/enrollments`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            window.location.assign('/login');
            return;
          }
          throw new Error(data.message);
        }
        showToast('success', 'Successfully enrolled! Redirecting…');
        enrollBtn.textContent = 'Enrolled!';
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        showToast('error', err.message);
        enrollBtn.disabled = false;
        enrollBtn.textContent = 'Enroll for Free';
      }
    } else {
      // Paid course: Stripe Checkout
      enrollBtn.textContent = 'Redirecting to checkout…';
      try {
        const res = await fetch(
          `/api/v1/payments/checkout-session/${courseId}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        window.location.assign(data.sessionUrl);
      } catch (err) {
        showToast('error', err.message);
        enrollBtn.disabled = false;
        enrollBtn.textContent = `Buy Now — $${price}`;
      }
    }
  });
}

// Continue Learning / Course Complete button
const continueBtn = document.querySelector('a.btn--primary[href="#lessons"]');
if (continueBtn) {
  (async () => {
    try {
      const { course, isEnrolled } = await getCourseData();
      if (!isEnrolled) return;

      const lessons = course.lessons || [];
      if (!lessons.length) return;

      const progRes = await fetch(
        `/api/v1/progress/courses/${resolvedCourseId}`,
      );
      const progData = await progRes.json();

      if (progRes.ok && progData.data.lessons.length) {
        const completedIds = new Set(
          progData.data.lessons
            .filter((p) => p.isCompleted)
            .map((p) => p.lesson._id),
        );

        const allDone = lessons.every((l) => completedIds.has(l._id));

        if (allDone) {
          // All lessons complete
          continueBtn.textContent = 'Course Completed!';
          continueBtn.classList.remove('btn--primary');
          continueBtn.classList.add('btn--success');
          continueBtn.href = `/lessons/${lessons[0]._id}`; // allow re-watching from start
          continueBtn.title = 'Click to review from the beginning';
        } else {
          // Go to first incomplete lesson
          const firstIncomplete = lessons.find((l) => !completedIds.has(l._id));
          continueBtn.href = `/lessons/${firstIncomplete._id}`;
        }
      } else {
        // No progress yet
        continueBtn.href = `/lessons/${lessons[0]._id}`;
      }
    } catch {}
  })();
}

// Ratings 
const ratingsContainer = document.querySelector('#ratings-container');

const loadRatings = async () => {
  if (!ratingsContainer) return;
  try {
    const { course, isEnrolled } = await getCourseData();

    const res = await fetch(
      `/api/v1/courses/${resolvedCourseId}/ratings?limit=10&sort=-createdAt`,
    );
    const data = await res.json();
    const ratings = res.ok ? data.data.ratings : [];

    // Existing reviews list 
    const listHtml = ratings.length
      ? ratings
          .map(
            (r) => `
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:1.1rem;margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.5rem;">
              <img src="/img/${r.user.photo}" alt="${r.user.name}"
                   style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
              <div>
                <strong style="font-size:.93rem;">${r.user.name}</strong>
                <div style="color:#f59e0b;font-size:.9rem;">
                  ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                </div>
              </div>
            </div>
            ${r.review ? `<p style="color:#374151;font-size:.92rem;">${r.review}</p>` : ''}
          </div>`,
          )
          .join('')
      : '<p style="color:#6b7280;margin-bottom:1rem;">No reviews yet. Be the first!</p>';

    // Review form (enrolled students only) 
    const formHtml = isEnrolled
      ? `
      <div id="review-form" style="border:2px solid #6c63ff;border-radius:12px;padding:1.25rem;margin-top:1.5rem;">
        <h4 style="margin-bottom:1rem;font-size:1rem;">Leave a Review</h4>
        <div style="margin-bottom:.75rem;">
          <label style="font-weight:600;font-size:.88rem;display:block;margin-bottom:.4rem;">Rating</label>
          <div id="star-selector" style="display:flex;gap:.35rem;font-size:1.8rem;cursor:pointer;">
            <span data-val="1" style="color:#d1d5db;">★</span>
            <span data-val="2" style="color:#d1d5db;">★</span>
            <span data-val="3" style="color:#d1d5db;">★</span>
            <span data-val="4" style="color:#d1d5db;">★</span>
            <span data-val="5" style="color:#d1d5db;">★</span>
          </div>
        </div>
        <div style="margin-bottom:1rem;">
          <label style="font-weight:600;font-size:.88rem;display:block;margin-bottom:.4rem;">Review (optional)</label>
          <textarea id="review-text" rows="3"
            style="width:100%;padding:.65rem .9rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:.95rem;resize:vertical;"
            placeholder="Share your experience…"></textarea>
        </div>
        <button id="submit-review"
          style="background:#6c63ff;color:#fff;border:none;padding:.65rem 1.4rem;border-radius:8px;font-weight:600;cursor:pointer;font-size:.95rem;">
          Submit Review
        </button>
      </div>`
      : '';

    ratingsContainer.innerHTML = listHtml + formHtml;

    // Star selector 
    let selectedRating = 0;
    const stars = document.querySelectorAll('#star-selector span');
    stars.forEach((star) => {
      star.addEventListener('mouseover', () => {
        const val = +star.dataset.val;
        stars.forEach(
          (s) =>
            (s.style.color = +s.dataset.val <= val ? '#f59e0b' : '#d1d5db'),
        );
      });
      star.addEventListener('mouseout', () => {
        stars.forEach(
          (s) =>
            (s.style.color =
              +s.dataset.val <= selectedRating ? '#f59e0b' : '#d1d5db'),
        );
      });
      star.addEventListener('click', () => {
        selectedRating = +star.dataset.val;
        stars.forEach(
          (s) =>
            (s.style.color =
              +s.dataset.val <= selectedRating ? '#f59e0b' : '#d1d5db'),
        );
      });
    });

    // Submit review 
    document
      .querySelector('#submit-review')
      ?.addEventListener('click', async () => {
        if (!selectedRating) {
          showToast('error', 'Please select a star rating.');
          return;
        }
        const review = document.querySelector('#review-text').value.trim();
        try {
          const r = await fetch(`/api/v1/courses/${resolvedCourseId}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: selectedRating, review }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.message);
          showToast('success', 'Review submitted successfully!');
          setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
          showToast('error', err.message);
        }
      });
  } catch {
    if (ratingsContainer)
      ratingsContainer.innerHTML =
        '<p style="color:#6b7280;">Could not load reviews.</p>';
  }
};

loadRatings();
