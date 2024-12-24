import Showvid from "../../utils/showbox.js";
import listenVid from "../../utils/showbox.js";
import Button from "../base/Button.js";

const ShowVidBox = (mediaSrc, mediaType = 'image') => {
  const sightbox = document.createElement('div');
  sightbox.className = 'sightbox';

  const overlay = document.createElement('div');
  overlay.className = 'sightbox-overlay';
  overlay.addEventListener('click', () => sightbox.remove());

  const content = document.createElement('div');
  content.className = 'sightbox-content';

  if (mediaType === 'image') {
    const img = document.createElement('img');
    img.src = mediaSrc;
    img.alt = 'Sightbox Image';
    content.appendChild(img);
  } else if (mediaType === 'video') {
    const video = document.createElement('video');
    video.src = mediaSrc;
    video.controls = true;
    video.muted = true;
    content.appendChild(video);
  }

  const closeButton = document.createElement('button');
  closeButton.className = 'sightbox-close';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => sightbox.remove());

  sightbox.innerHTML = Showvid(mediaSrc);
  listenVid();
  // sightbox.appendChild(generateVideoPlayer(mediaSrc));
  // sightbox.appendChild(overlay);
  // sightbox.appendChild(content);
  // content.appendChild(closeButton);

  document.body.appendChild(sightbox);
  return sightbox;
};



function generateVideoPlayer(mediaSrc) {
  // Create the main video player container
  const videoPlayer = document.createElement('div');
  videoPlayer.id = 'video-player';

  // Create the video element
  const video = document.createElement('video');
  video.id = 'main-video';
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.poster = '#';
  video.preload = 'metadata';

  // Create the source elements for the video
  const mp4Source = document.createElement('source');
  mp4Source.src = mediaSrc + '#t=0.01';
  mp4Source.type = 'video/mp4';

  const webmSource = document.createElement('source');
  // webmSource.src = 'https://i.imgur.com/gackYaQ.gifv';
  webmSource.type = 'video/webm';

  // Add sources to the video element
  video.appendChild(mp4Source);
  video.appendChild(webmSource);

  // Add a fallback message
  video.appendChild(document.createTextNode('Your browser does not support the video tag.'));

  // Create the controls container
  const controls = document.createElement('div');
  controls.className = 'controls';

  // Create the progress bar container
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.id = 'progress-bar';

  // Create the progress element
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.id = 'progress';

  // Add progress to the progress bar
  progressBar.appendChild(progress);

  // Create the buttons container
  const buttons = document.createElement('div');
  buttons.className = 'buttons';

  const slowerButton = Button("➖", "slower", {
    click: () => slower(),
    mouseenter: () => console.log("Button hovered"),
  });

  const resetSpeedButton = Button("⚌", "reset-speed", {
    click: () => resetSpeed(),
    mouseenter: () => console.log("Button hovered"),
  });

  const fasterButton = Button("➕", "faster", {
    click: () => faster(),
    mouseenter: () => console.log("Button hovered"),
  });

  const muteButton = Button("🔇", "mute", {
    click: () => navigator.clipboard.writeText(window.location.href),
    mouseenter: () => console.log("Button hovered"),
  });

  const shareButton = Button("Share", "share", {
    click: () => showMediaUploadForm(eventId),
    mouseenter: () => console.log("Button hovered"),
  });

  // // Create the buttons
  // const slowerButton = document.createElement('button');
  // slowerButton.id = 'slower';
  // slowerButton.textContent = '➖';

  // const resetSpeedButton = document.createElement('button');
  // resetSpeedButton.id = 'reset-speed';
  // resetSpeedButton.textContent = '⚌';

  // const fasterButton = document.createElement('button');
  // fasterButton.id = 'faster';
  // fasterButton.textContent = '➕';

  // const muteButton = document.createElement('button');
  // muteButton.id = 'mute';
  // muteButton.textContent = '🔇';

  // const shareButton = document.createElement('button');
  // shareButton.id = 'share';
  // shareButton.textContent = 'Share';

  // Add buttons to the buttons container
  buttons.appendChild(slowerButton);
  buttons.appendChild(resetSpeedButton);
  buttons.appendChild(fasterButton);
  buttons.appendChild(muteButton);
  buttons.appendChild(shareButton);

  // Add progress bar and buttons to the controls
  controls.appendChild(progressBar);
  controls.appendChild(buttons);

  // Add video and controls to the video player container
  videoPlayer.appendChild(video);
  videoPlayer.appendChild(controls);

  // Append the video player to the body or desired container
  return videoPlayer;
}

export default ShowVidBox;
