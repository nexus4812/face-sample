import { setupCamera } from './components/camera.ts';
// import { loadAndRunModel } from './components/blazeface.ts';
import { execute} from './components/face-landmarks-detection.ts';

import './style.css';

(async () => {
    const video = await setupCamera();
    await video.play();
    execute(video);
})();
