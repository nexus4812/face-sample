import { setupCamera } from './components/camera.ts';
import { loadAndRunModel } from './components/blazeface.ts';

(async () => {
    const video = await setupCamera();
    await video.play();
    await loadAndRunModel(video);
})();
