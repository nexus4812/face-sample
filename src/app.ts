import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';

export async function setupCamera(): Promise<HTMLVideoElement> {
    const video = document.getElementById('webcam') as HTMLVideoElement;

    if (!video) {
        throw new Error('Video element not found');
    }

    // カメラストリームの取得
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
    });

    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

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

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach((prediction) => {
            if (prediction.topLeft && prediction.bottomRight) {
                const [x1, y1] = prediction.topLeft;
                const [x2, y2] = prediction.bottomRight;

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            }
        });

        requestAnimationFrame(detectFaces);
    }

    detectFaces();
}
