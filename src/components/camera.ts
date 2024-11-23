export async function setupCamera(): Promise<HTMLVideoElement> {
    const video = document.getElementById('webcam') as HTMLVideoElement;

    if (!video) {
        throw new Error('Video element not found');
    }

    // カメラストリームの取得
    video.srcObject = await navigator.mediaDevices.getUserMedia({
        video: true,
    });

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}
