import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';

export async function loadAndRunModel(video: HTMLVideoElement) {
    const model = await blazeface.load();
    const canvas = document.getElementById('overlay') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas rendering context not found');
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    async function detectFaces() {
        const predictions = await model.estimateFaces(video, false);

        // @ts-ignore
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach((prediction: { topLeft: [any, any]; bottomRight: [any, any]; }) => {
            if (prediction.topLeft && prediction.bottomRight) {
                const [x1, y1] = prediction.topLeft;
                const [x2, y2] = prediction.bottomRight;

                if (!ctx) {
                    throw new Error('Canvas rendering context not found');
                }

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
        });

        requestAnimationFrame(detectFaces);
    }

    detectFaces();
}
