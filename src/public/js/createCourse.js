document.addEventListener('DOMContentLoaded', () => {
  // Lessons state 
  let lessons = [];
  let lessonOrder = 1;

  // Helpers 
  const showAlert = (type, msg) => {
    const box = document.querySelector('#course-alert');
    if (!box) return;
    box.innerHTML = `<div class="alert alert--${type}" style="margin-bottom:1.25rem;">${msg}</div>`;
    if (type === 'error')
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (type === 'success')
      setTimeout(() => {
        box.innerHTML = '';
      }, 4000);
  };

  const setSubmitLoading = (loading) => {
    const btn = document.querySelector('#create-course-submit-btn');
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    btn.disabled = loading;
    icon.className = loading ? 'bi bi-hourglass-split' : 'bi bi-check-lg';
    span.textContent = loading ? '  Creating…' : '  Create Course';
  };

  const reassignOrders = () => {
    lessons.forEach((l, i) => {
      l.order = i + 1;
    });
  };

  // Render lessons list 
  const renderLessons = () => {
    const container = document.querySelector('#lessons-container');

    if (!lessons.length) {
      container.innerHTML =
        '<p class="loading-text lessons-empty-hint">No lessons added yet. Use the form below to add your first lesson.</p>';
      return;
    }

    container.innerHTML = lessons
      .map(
        (l, i) => `
      <div class="lesson-builder-item" data-index="${i}">
        <div class="lesson-builder-item__left">
          <span class="lesson-builder-item__order">${l.order}</span>
          <div class="lesson-builder-item__info">
            <span class="lesson-builder-item__title">${l.title}</span>
            <div class="lesson-builder-item__meta">
              ${l.duration ? `<span><i class="bi bi-clock"></i> ${l.duration} min</span>` : ''}
              ${l.videoFile ? `<span><i class="bi bi-camera-video"></i> ${l.videoFile.name}</span>` : ''}
              ${l.isFree ? `<span class="badge badge--success" style="font-size:.72rem;">Free Preview</span>` : ''}
            </div>
          </div>
        </div>
        <div class="lesson-builder-item__actions">
          <button class="btn btn--sm btn--ghost lesson-move-up"   data-index="${i}" title="Move up"   ${i === 0 ? 'disabled' : ''}>
            <i class="bi bi-arrow-up"></i>
          </button>
          <button class="btn btn--sm btn--ghost lesson-move-down" data-index="${i}" title="Move down" ${i === lessons.length - 1 ? 'disabled' : ''}>
            <i class="bi bi-arrow-down"></i>
          </button>
          <button class="btn btn--sm btn--ghost lesson-remove"    data-index="${i}" title="Remove" style="color:var(--color-danger);">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `,
      )
      .join('');

    // Move up
    container.querySelectorAll('.lesson-move-up').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.index;
        if (i === 0) return;
        [lessons[i - 1], lessons[i]] = [lessons[i], lessons[i - 1]];
        reassignOrders();
        renderLessons();
      });
    });

    // Move down
    container.querySelectorAll('.lesson-move-down').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.index;
        if (i === lessons.length - 1) return;
        [lessons[i], lessons[i + 1]] = [lessons[i + 1], lessons[i]];
        reassignOrders();
        renderLessons();
      });
    });

    // Remove
    container.querySelectorAll('.lesson-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        lessons.splice(+btn.dataset.index, 1);
        reassignOrders();
        renderLessons();
      });
    });
  };

  // Add lesson 
  document.querySelector('#add-lesson-btn').addEventListener('click', () => {
    const title = document.querySelector('#lesson-title').value.trim();
    const duration =
      parseInt(document.querySelector('#lesson-duration').value) || 0;
    const videoFile = document.querySelector('#lesson-video').files[0] || null;
    const content = document.querySelector('#lesson-content').value.trim();
    const order =
      parseInt(document.querySelector('#lesson-order').value) || lessonOrder;
    const isFree = document.querySelector('#lesson-is-free').checked;

    if (!title || title.length < 3) {
      alert('Lesson title must be at least 3 characters.');
      document.querySelector('#lesson-title').focus();
      return;
    }

    lessons.push({ title, duration, videoFile, content, order, isFree });
    reassignOrders();
    renderLessons();

    // Reset form
    document.querySelector('#lesson-title').value = '';
    document.querySelector('#lesson-duration').value = '0';
    document.querySelector('#lesson-video').value = '';
    document.querySelector('#lesson-content').value = '';
    document.querySelector('#lesson-is-free').checked = false;
    lessonOrder = lessons.length + 1;
    document.querySelector('#lesson-order').value = lessonOrder;
    document.querySelector('#lesson-title').focus();
  });

  // Enter key on lesson title triggers add
  document.querySelector('#lesson-title').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.querySelector('#add-lesson-btn').click();
    }
  });

  //  Dynamic list helper 
  const makeDynamicList = (listId, inputId, btnId) => {
    const list = document.querySelector(`#${listId}`);
    const input = document.querySelector(`#${inputId}`);
    const btn = document.querySelector(`#${btnId}`);
    const items = [];

    const render = () => {
      list.innerHTML = items
        .map(
          (item, i) => `
        <div class="dynamic-list__item">
          <span>${item}</span>
          <button type="button" class="dynamic-list__remove" data-index="${i}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      `,
        )
        .join('');
      list.querySelectorAll('.dynamic-list__remove').forEach((removeBtn) => {
        removeBtn.addEventListener('click', () => {
          items.splice(+removeBtn.dataset.index, 1);
          render();
        });
      });
    };

    const addItem = () => {
      const val = input.value.trim();
      if (!val) return;
      if (listId === 'tags-list' && items.length >= 10) return;
      if (!items.includes(val)) {
        items.push(val);
        render();
      }
      input.value = '';
      input.focus();
    };

    btn.addEventListener('click', addItem);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addItem();
      }
    });

    return { getItems: () => [...items] };
  };

  const learnList = makeDynamicList(
    'learn-list',
    'learn-input',
    'learn-add-btn',
  );
  const reqList = makeDynamicList('req-list', 'req-input', 'req-add-btn');
  const tagsList = makeDynamicList('tags-list', 'tags-input', 'tags-add-btn');

  // Submit 
  document
    .querySelector('#create-course-submit-btn')
    .addEventListener('click', async () => {
      const title = document.querySelector('#title').value.trim();
      const description = document.querySelector('#description').value.trim();
      const summary = document.querySelector('#summary').value.trim();
      const category = document.querySelector('#category').value;
      const level = document.querySelector('#level').value;
      const price = parseFloat(document.querySelector('#price').value) || 0;
      const isPublished =
        document.querySelector('input[name="publish"]:checked').value ===
        'true';

      // ── Validate ──
      if (!title || title.length < 5) {
        return showAlert(
          'error',
          'Course title must be at least 5 characters.',
        );
      }
      if (!description || description.length < 20) {
        return showAlert(
          'error',
          'Description must be at least 20 characters.',
        );
      }
      if (!category) {
        return showAlert('error', 'Please select a category.');
      }

      setSubmitLoading(true);

      try {
        // ── 1. Create the course (FormData for thumbnail) ─
        const courseFd = new FormData();
        courseFd.append('title', title);
        courseFd.append('description', description);
        courseFd.append('summary', summary);
        courseFd.append('category', category);
        courseFd.append('level', level);
        courseFd.append('price', price);
        courseFd.append('isPublished', isPublished);
        learnList
          .getItems()
          .forEach((i) => courseFd.append('whatYouLearn[]', i));
        reqList.getItems().forEach((i) => courseFd.append('requirements[]', i));
        tagsList.getItems().forEach((i) => courseFd.append('tags[]', i));
        const thumbFile = document.querySelector('#thumbnail')?.files[0];
        if (thumbFile) courseFd.append('thumbnail', thumbFile);

        const courseRes = await fetch('/api/v1/courses', {
          method: 'POST',
          body: courseFd, // No Content-Type — browser sets multipart boundary
        });
        const courseData = await courseRes.json();
        if (!courseRes.ok) throw new Error(courseData.message);

        const courseId = courseData.data.course._id;

        // ── 2. Create lessons (FormData for video) ─
        for (const lesson of lessons) {
          const fd = new FormData();
          fd.append('title', lesson.title);
          fd.append('course', courseId);
          fd.append('duration', lesson.duration);
          fd.append('content', lesson.content);
          fd.append('order', lesson.order);
          fd.append('isFree', lesson.isFree);
          if (lesson.videoFile) fd.append('video', lesson.videoFile);

          const lessonRes = await fetch('/api/v1/lessons', {
            method: 'POST',
            body: fd, // No Content-Type — browser sets multipart boundary automatically
          });
          const lessonData = await lessonRes.json();
          if (!lessonRes.ok) {
            console.warn(
              `Lesson "${lesson.title}" failed: ${lessonData.message}`,
            );
          }
        }

        // ── 3. Done ───────────────────────────────
        showAlert(
          'success',
          `Course created with ${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}! Redirecting…`,
        );
        setTimeout(() => window.location.assign('/dashboard'), 1500);
      } catch (err) {
        showAlert('error', err.message);
        setSubmitLoading(false);
      }
    });

  // Free preview checkbox styling 
  const isFreeCheckbox = document.querySelector('#lesson-is-free');
  const isFreeLabel = document.querySelector('label[for="lesson-is-free"]');
  if (isFreeCheckbox && isFreeLabel) {
    isFreeCheckbox.addEventListener('change', () => {
      if (isFreeCheckbox.checked) {
        isFreeLabel.style.borderColor = 'var(--color-primary)';
        isFreeLabel.style.background = 'var(--color-primary-light)';
        isFreeLabel.style.color = 'var(--color-primary)';
      } else {
        isFreeLabel.style.borderColor = 'var(--color-border)';
        isFreeLabel.style.background = '';
        isFreeLabel.style.color = '';
      }
    });
  }

  // Thumbnail live preview 
  document.querySelector('#thumbnail')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.querySelector('#thumbnail-preview');
      if (preview) preview.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}); 
