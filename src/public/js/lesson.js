/* Lumio — lesson.js */
const markBtn = document.querySelector('#mark-complete-btn');
if (markBtn) {
  // If already completed on page load — make button static immediately
  if (markBtn.dataset.completed === 'true') {
    markBtn.disabled = true;
    markBtn.style.opacity = '0.7';
    markBtn.style.cursor = 'default';
  }

  markBtn.addEventListener('click', async () => {
    // Already completed — do nothing
    if (markBtn.dataset.completed === 'true') return;

    const lessonId = markBtn.dataset.lessonId;

    markBtn.disabled = true;
    markBtn.textContent = 'Saving…';

    try {
      const res = await fetch(`/api/v1/progress/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true }),
      });
      if (!res.ok) throw new Error('Failed to update progress');

      // Mark as permanently done
      markBtn.dataset.completed = 'true';
      markBtn.textContent = 'Completed';
      markBtn.style.opacity = '0.7';
      markBtn.style.cursor = 'default';

      // Update sidebar icon for this lesson
      const sidebarActive = document.querySelector(
        '.lesson-sidebar__item--active .bi',
      );
      if (sidebarActive) {
        sidebarActive.className = 'bi bi-check-circle-fill';
        sidebarActive.style.color = '#22c55e';
      }

      showToast('success', 'Lesson marked as complete!');
    } catch (err) {
      markBtn.disabled = false;
      markBtn.textContent = 'Mark as Complete';
      showToast('error', 'Could not update progress: ' + err.message);
    }
  });
}

// Custom Video Player 
const video = document.querySelector('#lesson-video-player');
const playBtn = document.querySelector('#play-btn');
const playIcon = document.querySelector('#play-icon');
const muteBtn = document.querySelector('#mute-btn');
const muteIcon = document.querySelector('#mute-icon');
const volumeSlider = document.querySelector('#volume-slider');
const timeDisplay = document.querySelector('#time-display');
const progressBar = document.querySelector('#progress-bar');
const progressFill = document.querySelector('#progress-fill');
const progressThumb = document.querySelector('#progress-thumb');
const fullscreenBtn = document.querySelector('#fullscreen-btn');
const speedBtn = document.querySelector('#speed-btn');
const speedMenu = document.querySelector('#speed-menu');

if (video && playBtn) {
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${sec}`;
  };

  const updateProgress = () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    progressFill.style.width = `${pct}%`;
    progressThumb.style.left = `${pct}%`;
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  };

  // Play / Pause
  playBtn.addEventListener('click', () => {
    video.paused ? video.play() : video.pause();
  });
  video.addEventListener('play', () => {
    playIcon.className = 'bi bi-pause-fill';
  });
  video.addEventListener('pause', () => {
    playIcon.className = 'bi bi-play-fill';
  });
  video.addEventListener('ended', () => {
    playIcon.className = 'bi bi-play-fill';
  });

  // Progress
  video.addEventListener('timeupdate', updateProgress);
  video.addEventListener('loadedmetadata', updateProgress);

  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  });

  // Mute
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteIcon.className = video.muted
      ? 'bi bi-volume-mute-fill'
      : 'bi bi-volume-up-fill';
    volumeSlider.value = video.muted ? 0 : video.volume;
  });

  volumeSlider.addEventListener('input', () => {
    video.volume = volumeSlider.value;
    video.muted = video.volume === 0;
    muteIcon.className = video.muted
      ? 'bi bi-volume-mute-fill'
      : 'bi bi-volume-up-fill';
  });

  // Speed
  speedBtn.addEventListener('click', () => speedMenu.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!speedBtn.contains(e.target) && !speedMenu.contains(e.target)) {
      speedMenu.classList.remove('open');
    }
  });
  speedMenu.querySelectorAll('.video-speed__option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const speed = parseFloat(opt.dataset.speed);
      video.playbackRate = speed;
      speedBtn.textContent = `${speed}×`;
      speedMenu
        .querySelectorAll('.video-speed__option')
        .forEach((o) => o.classList.remove('active'));
      opt.classList.add('active');
      speedMenu.classList.remove('open');
    });
  });

  // Fullscreen
  fullscreenBtn.addEventListener('click', () => {
    const wrapper = video.closest('.lesson-player__video');
    if (document.fullscreenElement) {
      document.exitFullscreen();
      fullscreenBtn.querySelector('i').className = 'bi bi-fullscreen';
    } else {
      wrapper.requestFullscreen();
      fullscreenBtn.querySelector('i').className = 'bi bi-fullscreen-exit';
    }
  });

  // Click on video to play/pause
  video.addEventListener('click', () => {
    video.paused ? video.play() : video.pause();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === ' ') {
      e.preventDefault();
      video.paused ? video.play() : video.pause();
    }
    if (e.key === 'ArrowRight')
      video.currentTime = Math.min(video.currentTime + 5, video.duration);
    if (e.key === 'ArrowLeft')
      video.currentTime = Math.max(video.currentTime - 5, 0);
    if (e.key === 'ArrowUp') video.volume = Math.min(video.volume + 0.1, 1);
    if (e.key === 'ArrowDown') video.volume = Math.max(video.volume - 0.1, 0);
    if (e.key === 'm' || e.key === 'M') muteBtn.click();
    if (e.key === 'f' || e.key === 'F') fullscreenBtn.click();
  });
}
