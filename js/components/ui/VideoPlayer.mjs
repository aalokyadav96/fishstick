import { Button } from "../base/Button";
import VidPop from "./Vidpop.mjs";

const VideoPlayer = ({ src, poster, controls = true, autoplay = false, muted = true }) => {
  const videocon = document.createElement('div');
  videocon.className = 'video-container';

  const video = document.createElement('video');
  video.src = src;
  video.poster = poster;
  video.controls = controls;
  video.autoplay = autoplay;
  video.className = 'video-player';
  video.muted = muted;
  video.loop = true;
  video.preload = 'metadata';

  // Add click event listener
  video.addEventListener('click', function () {
    this.paused ? this.play() : this.pause();
  });

  const buttn = Button('Theater Mode', 'theater', {
    click: () => gdryfjrn(src, 'video', video),
  });

  videocon.appendChild(video);
  videocon.appendChild(buttn);
  return videocon;
};

function gdryfjrn(src, v, video) {
  video.pause;
  VidPop(src, v);
}

export default VideoPlayer;

// const VideoPlayer = ({ src, poster, controls = true, autoplay = false, muted = true }) => {
//   const video = document.createElement('video');
//   video.src = src;
//   // video.poster = poster;
//   video.controls = controls;
//   video.autoplay = autoplay;
//   video.className = 'video-player';
//   video.muted = muted;

//   // Add click event listener
//   video.addEventListener('click', function () {
//       this.paused ? this.play() : this.pause();
//   });

//   return video;
// };

// export default VideoPlayer;

// // const VideoPlayer = ({ src, poster, controls = true, autoplay = false, muted = true, onclick }) => {
// //   const video = document.createElement('video');
// //   video.src = src;
// //   video.poster = poster;
// //   video.controls = controls;
// //   video.autoplay = autoplay;
// //   video.className = 'video-player';
// //   video.onclick = onclick; // Corrected from 'onclik' to 'onclick'
// //   video.muted = muted;

// //   return video;
// // };

// // export default VideoPlayer;
