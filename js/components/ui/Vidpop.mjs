import Button from "../base/Button.js";


const Vidpop = (mediaSrc) => {
  const sightbox = document.createElement('div');
  sightbox.className = 'sightbox';

  const overlay = document.createElement('div');
  overlay.className = 'sightbox-overlay';
  overlay.addEventListener('click', () => sightbox.remove());

  const content = document.createElement('div');
  content.className = 'sightbox-content';

  const closeButton = document.createElement('button');
  closeButton.className = 'sightbox-close';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => sightbox.remove());

  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  content.appendChild(generateVideoPlayer(mediaSrc));
  content.appendChild(closeButton);

  document.body.appendChild(sightbox);
  return sightbox;
};

function generateVideoPlayer(mediaSrc) {
  const videoPlayer = document.createElement('div');
  videoPlayer.id = 'video-player';

  const video = document.createElement('video');
  video.id = 'main-video';
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.poster = '#';
  video.preload = 'metadata';

  const mp4Source = document.createElement('source');
  mp4Source.src = mediaSrc + '#t=0.01';
  mp4Source.type = 'video/mp4';

  const webmSource = document.createElement('source');
  webmSource.type = 'video/webm';

  video.appendChild(mp4Source);
  video.appendChild(webmSource);
  video.appendChild(document.createTextNode('Your browser does not support the video tag.'));

  const controls = document.createElement('div');
  controls.className = 'controls';

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progress = document.createElement('div');
  progress.className = 'progress';

  progressBar.appendChild(progress);

  const buttons = document.createElement('div');
  buttons.className = 'buttons';

  const slowerButton = Button("➖", "slower", { click: () => slower(video) });
  const resetSpeedButton = Button("⚌", "reset-speed", { click: () => resetSpeed(video) });
  const fasterButton = Button("➕", "faster", { click: () => faster(video) });
  const muteButton = Button("🔇", "mute", { click: () => mute(video, muteButton) });
  const shareButton = Button("Share", "share", {
    click: () => navigator.clipboard.writeText(window.location.href),
  });

  buttons.appendChild(slowerButton);
  buttons.appendChild(resetSpeedButton);
  buttons.appendChild(fasterButton);
  buttons.appendChild(muteButton);
  buttons.appendChild(shareButton);

  controls.appendChild(progressBar);
  controls.appendChild(buttons);

  videoPlayer.appendChild(video);
  videoPlayer.appendChild(controls);

  setupVideoUtilityFunctions(video, progress);

  return videoPlayer;
}

function setupVideoUtilityFunctions(video, progress) {
  let angle = 0;
  let flip = false;
  const hotkeysEnabled = true;

  // Add click event listener
  video.addEventListener('click', function () {
    this.paused ? this.play() : this.pause();
  });
  
  video.addEventListener('timeupdate', () => {
    const total = (video.currentTime / video.duration) * 100;
    progress.style.width = total + '%';
  });

  video.parentElement.querySelector('.progress-bar').addEventListener('mousedown', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / e.currentTarget.clientWidth;
    video.currentTime = video.duration * fraction;
  });

  window.addEventListener('keypress', (e) => {
    if (!hotkeysEnabled) return;

    switch (e.key) {
      case ',':
        video.currentTime -= 1 / 12;
        break;
      case '.':
        video.currentTime += 1 / 12;
        break;
      case 'c':
        faster(video);
        break;
      case 'x':
        resetSpeed(video);
        break;
      case 'z':
        slower(video);
        break;
      case 'b':
        setVolume(video, -0.1);
        break;
      case 'n':
        setVolume(video, 0.1);
        break;
      case 'm':
        mute(video);
        break;
      case 'r':
        rotateVideo(video, angle);
        angle = (angle + 90) % 360;
        break;
      case 'h':
        flipVideo(video, flip);
        flip = !flip;
        break;
      case 'v':
        video.paused ? video.play() : video.pause();
        break;
    }
  });
}

function setVolume(video, value) {
  video.volume = Math.min(1, Math.max(0, video.volume + value));
}

function rotateVideo(video, angle) {
  video.style.transform = `rotate(${angle}deg)`;
}

function flipVideo(video, flip) {
  video.style.transform = flip ? 'scaleX(-1)' : 'scaleX(1)';
}

function mute(video, button) {
  video.muted = !video.muted;
  if (button) {
    button.textContent = video.muted ? '🔇' : '🔊';
  }
}

function resetSpeed(video) {
  video.playbackRate = 1;
}

function slower(video) {
  video.playbackRate = Math.max(0.25, video.playbackRate - 0.15);
}

function faster(video) {
  video.playbackRate = Math.min(3.0, video.playbackRate + 0.15);
}

export default Vidpop;
