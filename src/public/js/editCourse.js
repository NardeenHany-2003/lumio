document.addEventListener('DOMContentLoaded', () => {
  // Alerts 
  const showToast = (boxId, type, msg) => {
    const box = document.querySelector(`#${boxId}`);
    if (!box) return;
    box.innerHTML = `<div class="alert alert--${type}" style="margin-bottom:1.25rem;">${msg}</div>`;
    if (type === 'error')
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (type === 'success')
      setTimeout(() => {
        box.innerHTML = '';
      }, 4000);
  };

  const setLoading = (btn, loading, defaultIcon, defaultLabel) => {
    btn.disabled = loading;
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (icon) icon.className = loading ? 'bi bi-hourglass-split' : defaultIcon;
    if (span) span.textContent = loading ? '  Saving…' : defaultLabel;
  };

  // Dynamic list helper 
  const makeDynamicList = (listId, inputId, btnId, initial = []) => {
    const list = document.querySelector(`#${listId}`);
    const input = document.querySelector(`#${inputId}`);
    const btn = document.querySelector(`#${btnId}`);
    const items = [...initial];

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

    render(); // render existing items immediately
    return { getItems: () => [...items] };
  };

  const learnList = makeDynamicList(
    'learn-list',
    'learn-input',
    'learn-add-btn',
    WHAT_YOU_LEARN,
  );
  const reqList = makeDynamicList(
    'req-list',
    'req-input',
    'req-add-btn',
    REQUIREMENTS,
  );
  const tagsList = makeDynamicList(
    'tags-list',
    'tags-input',
    'tags-add-btn',
    TAGS,
  );

  // Save Basic Info 
  const saveCourseBtn = document.querySelector('#save-course-btn');
  saveCourseBtn.addEventListener('click', async () => {
    const title = document.querySelector('#title').value.trim();
    const description = document.querySelector('#description').value.trim();
    const summary = document.querySelector('#summary').value.trim();
    const category = document.querySelector('#category').value;
    const level = document.querySelector('#level').value;
    const price = parseFloat(document.querySelector('#price').value) || 0;

    if (!title || title.length < 5)
      return showToast(
        'course-alert',
        'error',
        'Title must be at least 5 characters.',
      );
    if (!description || description.length < 20)
      return showToast(
        'course-alert',
        'error',
        'Description must be at least 20 characters.',
      );
    if (!category)
      return showToast('course-alert', 'error', 'Please select a category.');

    setLoading(saveCourseBtn, true, 'bi bi-check-lg', '  Save Changes');
    try {
      const courseFd = new FormData();
      courseFd.append('title', title);
      courseFd.append('description', description);
      courseFd.append('summary', summary);
      courseFd.append('category', category);
      courseFd.append('level', level);
      courseFd.append('price', price);
      const thumbFile = document.querySelector('#thumbnail')?.files[0];
      if (thumbFile) courseFd.append('thumbnail', thumbFile);

      const res = await fetch(`/api/v1/courses/${COURSE_ID}`, {
        method: 'PATCH',
        body: courseFd, 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update preview if new thumbnail was uploaded
      if (thumbFile && data.data?.course?.thumbnail) {
        const preview = document.querySelector('#thumbnail-preview');
        if (preview) preview.src = `/img/${data.data.course.thumbnail}`;
      }

      showToast('course-alert', 'success', 'Course info saved.');
    } catch (err) {
      showToast('course-alert', 'error', err.message);
    } finally {
      setLoading(saveCourseBtn, false, 'bi bi-check-lg', '  Save Changes');
    }
  });

  // Save Outcomes 
  const saveOutcomesBtn = document.querySelector('#save-outcomes-btn');
  saveOutcomesBtn.addEventListener('click', async () => {
    setLoading(saveOutcomesBtn, true, 'bi bi-check-lg', '  Save Outcomes');
    try {
      const res = await fetch(`/api/v1/courses/${COURSE_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatYouLearn: learnList.getItems(),
          requirements: reqList.getItems(),
          tags: tagsList.getItems(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('course-alert', 'success', 'Outcomes saved.');
    } catch (err) {
      showToast('course-alert', 'error', err.message);
    } finally {
      setLoading(saveOutcomesBtn, false, 'bi bi-check-lg', '  Save Outcomes');
    }
  });

  // Publish / Unpublish 
  const togglePublishBtn = document.querySelector('#toggle-publish-btn');
  if (togglePublishBtn) {
    togglePublishBtn.addEventListener('click', async () => {
      const isPublished = togglePublishBtn.dataset.published === 'true';
      const endpoint = isPublished ? 'unpublish' : 'publish';
      try {
        const res = await fetch(`/api/v1/courses/${COURSE_ID}/${endpoint}`, {
          method: 'PATCH',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast(
          'course-alert',
          'success',
          `Course ${isPublished ? 'unpublished' : 'published'}.`,
        );
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        showToast('course-alert', 'error', err.message);
      }
    });
  }

  // Lessons 
  const renderLessonsList = async () => {
    const container = document.querySelector('#lessons-list-container');
    try {
      const res = await fetch(`/api/v1/courses/${COURSE_ID}/lessons`);
      const data = await res.json();
      if (!res.ok) return;

      const lessons = data.data.lessons;
      if (!lessons.length) {
        container.innerHTML = '<p class="loading-text">No lessons yet.</p>';
        return;
      }

      container.innerHTML = lessons
        .map(
          (l) => `
        <div class="lesson-builder-item">
          <div class="lesson-builder-item__left">
            <span class="lesson-builder-item__order">${l.order}</span>
            <div class="lesson-builder-item__info">
              <span class="lesson-builder-item__title">${l.title}</span>
              <div class="lesson-builder-item__meta">
                ${l.duration ? `<span><i class="bi bi-clock"></i> ${l.duration} min</span>` : ''}
                ${l.videoPath ? `<span><i class="bi bi-camera-video"></i> Has video</span>` : ''}
                ${l.isFree ? `<span class="badge badge--success" style="font-size:.72rem;">Free</span>` : ''}
              </div>
            </div>
          </div>
          <div class="lesson-builder-item__actions">
            <button class="btn btn--sm btn--ghost lesson-edit-btn" data-id="${l._id}" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn--sm btn--ghost lesson-delete-btn" data-id="${l._id}" data-title="${l.title}" title="Delete" style="color:var(--color-danger);">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      `,
        )
        .join('');

      // Edit lesson
      // Edit lesson
      container.querySelectorAll('.lesson-edit-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const lessonRes = await fetch(`/api/v1/lessons/${btn.dataset.id}`);
            const lessonData = await lessonRes.json();
            if (!lessonRes.ok) throw new Error(lessonData.message);
            populateLessonForm(lessonData.data.lesson);
          } catch (err) {
            showToast(
              'lesson-alert',
              'error',
              `Could not load lesson: ${err.message}`,
            );
          }
        });
      });

      // Delete lesson
      container.querySelectorAll('.lesson-delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const confirmed = await lumioConfirm({
            title: 'Delete Lesson',
            message: `Are you sure you want to delete "<strong>${btn.dataset.title}</strong>"? This cannot be undone.`,
            confirmLabel: 'Delete',
            confirmClass: 'btn--danger',
            cancelLabel: 'Cancel',
            icon: '🗑️',
          });
          if (!confirmed) return;
          const res = await fetch(`/api/v1/lessons/${btn.dataset.id}`, {
            method: 'DELETE',
          });
          if (res.ok || res.status === 204) {
            showToast('lesson-alert', 'success', 'Lesson deleted.');
            renderLessonsList();
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<p style="color:#ef4444;">Could not load lessons: ${err.message}</p>`;
    }
  };

  // Populate lesson form for editing 
  const populateLessonForm = (lesson) => {
    document.querySelector('#editing-lesson-id').value = lesson._id;
    document.querySelector('#lesson-title').value = lesson.title || '';
    document.querySelector('#lesson-duration').value = lesson.duration || 0;
    document.querySelector('#lesson-content').value = lesson.content || '';
    document.querySelector('#lesson-order').value = lesson.order || 1;
    document.querySelector('#lesson-is-free').checked = lesson.isFree || false;
    document.querySelector('#lesson-video').value = ''; // file inputs can't be pre-filled

    // Update isFree label styling to match the checkbox state
    const isFreeLabel = document.querySelector('label[for="lesson-is-free"]');
    if (isFreeLabel) {
      isFreeLabel.style.borderColor = lesson.isFree
        ? 'var(--color-primary)'
        : 'var(--color-border)';
      isFreeLabel.style.background = lesson.isFree
        ? 'var(--color-primary-light)'
        : '';
      isFreeLabel.style.color = lesson.isFree ? 'var(--color-primary)' : '';
    }

    // Show existing video info
    const existingVideoEl = document.querySelector('#existing-video-info');
    if (lesson.videoPath) {
      existingVideoEl.innerHTML = `
      <div class="existing-video-row">
        <i class="bi bi-camera-video-fill" style="color:var(--color-primary);"></i>
        <span>Current video: <strong>${lesson.videoPath.split('/').pop()}</strong></span>
        <button type="button" id="remove-video-btn" class="btn btn--sm btn--ghost" style="color:var(--color-danger);">
          <i class="bi bi-trash"></i> Remove
        </button>
      </div>
    `;
      document
        .querySelector('#remove-video-btn')
        .addEventListener('click', () => {
          document.querySelector('#remove-video-flag').value = 'true';
          existingVideoEl.innerHTML =
            '<p style="color:var(--color-danger);font-size:.88rem;"><i class="bi bi-exclamation-circle"></i> Video will be removed on save.</p>';
        });
    } else {
      existingVideoEl.innerHTML = '';
    }

    document.querySelector('#remove-video-flag').value = 'false';
    document.querySelector('#lesson-form-title').textContent = '  Edit Lesson';
    document.querySelector('#cancel-edit-lesson-btn').style.display =
      'inline-flex';
    document
      .querySelector('#lesson-title')
      .scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('#lesson-title').focus();
  };

  // Reset lesson form 
  const resetLessonForm = () => {
    document.querySelector('#editing-lesson-id').value = '';
    document.querySelector('#lesson-title').value = '';
    document.querySelector('#lesson-duration').value = '0';
    document.querySelector('#lesson-video').value = '';
    document.querySelector('#lesson-content').value = '';
    document.querySelector('#lesson-order').value = '1';
    document.querySelector('#lesson-is-free').checked = false;
    document.querySelector('#lesson-form-title').textContent =
      '  Add New Lesson';
    document.querySelector('#cancel-edit-lesson-btn').style.display = 'none';
  };

  document
    .querySelector('#cancel-edit-lesson-btn')
    .addEventListener('click', resetLessonForm);

  // Save lesson (create or update) 
  const saveLessonBtn = document.querySelector('#save-lesson-btn');
  saveLessonBtn.addEventListener('click', async () => {
    const editingId = document.querySelector('#editing-lesson-id').value;
    const title = document.querySelector('#lesson-title').value.trim();
    const duration =
      parseInt(document.querySelector('#lesson-duration').value) || 0;
    const content = document.querySelector('#lesson-content').value.trim();
    const order = parseInt(document.querySelector('#lesson-order').value) || 1;
    const isFree = document.querySelector('#lesson-is-free').checked;
    const videoFile = document.querySelector('#lesson-video').files[0] || null;
    const removeVideo = document.querySelector('#remove-video-flag').value;

    if (!title || title.length < 3) {
      return showToast(
        'lesson-alert',
        'error',
        'Lesson title must be at least 3 characters.',
      );
    }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('duration', duration);
    fd.append('content', content);
    fd.append('order', order);
    fd.append('isFree', isFree);
    fd.append('removeVideo', removeVideo);
    if (!editingId) fd.append('course', COURSE_ID);
    if (videoFile) fd.append('video', videoFile);

    const url = editingId ? `/api/v1/lessons/${editingId}` : '/api/v1/lessons';
    const method = editingId ? 'PATCH' : 'POST';

    setLoading(saveLessonBtn, true, 'bi bi-check-lg', '  Save Lesson');
    try {
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast(
        'lesson-alert',
        'success',
        `Lesson ${editingId ? 'updated' : 'added'}.`,
      );
      resetLessonForm();
      renderLessonsList();
    } catch (err) {
      showToast('lesson-alert', 'error', err.message);
    } finally {
      setLoading(saveLessonBtn, false, 'bi bi-check-lg', '  Save Lesson');
    }
  });

  // Free preview checkbox styling 
  const isFreeCheckbox = document.querySelector('#lesson-is-free');
  const isFreeLabel = document.querySelector('label[for="lesson-is-free"]');
  if (isFreeCheckbox && isFreeLabel) {
    isFreeCheckbox.addEventListener('change', () => {
      isFreeLabel.style.borderColor = isFreeCheckbox.checked
        ? 'var(--color-primary)'
        : 'var(--color-border)';
      isFreeLabel.style.background = isFreeCheckbox.checked
        ? 'var(--color-primary-light)'
        : '';
      isFreeLabel.style.color = isFreeCheckbox.checked
        ? 'var(--color-primary)'
        : '';
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

  //  Initial load 
  renderLessonsList();
}); 
