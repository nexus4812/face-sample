import { setupCamera, loadAndRunModel } from './app';

(async () => {
    const video = await setupCamera();
    video.play();
    await loadAndRunModel(video);
})();
