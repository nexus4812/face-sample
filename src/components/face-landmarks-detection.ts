import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import {FaceLandmarksDetector} from "@tensorflow-models/face-landmarks-detection/dist/face_landmarks_detector";
import {Keypoint} from "@tensorflow-models/face-landmarks-detection";

const statusMessageElement = document.getElementById("status-message")!;
const progressBarElement = document.getElementById("progress")!;
const directionElement = document.getElementById("direction")!;

let verticalVerified = false;
let horizontalVerified = false;
let currentProgress = 0;

async function updateUI(status: string, progress: number) {
    statusMessageElement.textContent = status;
    currentProgress = Math.min(100, progress);
    progressBarElement.style.width = `${currentProgress}%`;

    if (!verticalVerified) {
        directionElement.textContent = 'Move your face up'
        return;
    }

    if (!horizontalVerified) {
        directionElement.textContent = 'Move your face side-to-side'
        return;
    }

    directionElement.textContent = 'Completed!!'
}

async function resetUI(reason: string) {
    await updateUI(reason, 0);
    verticalVerified = false;
    horizontalVerified = false;
}

export async function execute(videoElement: HTMLVideoElement): Promise<void> {
    const model = await createModel();

    await updateUI('Start face authentication', 0)

    setInterval(async () => {
        // 動画フレームから顔のランドマークを推定
        const predictions = await model.estimateFaces(videoElement);

        if (predictions.length === 0) {
            return false;
        }

        const landmarks = predictions[0].keypoints;
        if (!isFaceConsistent(landmarks)) {
            await resetUI("Face consistency failed. Resetting...");
            return;
        }

        if (!verticalVerified && isVerticalMovementSignificant(landmarks)) {
            verticalVerified = true;
            await updateUI("Vertical movement verified", currentProgress + 50);
        }

        if (!horizontalVerified && isHorizontalMovementSignificant(landmarks)) {
            horizontalVerified = true;
            await updateUI("Horizontal movement verified", currentProgress + 50);
        }

        if (verticalVerified && horizontalVerified) {
            await updateUI(`Face authentication successful! Your face Id`, 100);
        }
    }, 100);
}

export async function createModel(): Promise<FaceLandmarksDetector> {
    // MediaPipeFaceMeshモデルを作成
    return faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
            runtime: 'mediapipe', // TensorFlow.jsランタイムを使用
            refineLandmarks: true, // ランドマークを詳細化する設定
            solutionPath: 'node_modules/@mediapipe/face_mesh',
            maxFaces: 1, // 同時に検出する顔の数
        }
    )
}


let lastLandMarks: Keypoint[]  = []

// 途中で顔の差し替えがないか、前回のfaceLandmarkと比較して検証する
function isFaceConsistent(
    current: faceLandmarksDetection.Keypoint[]
): boolean {
    const prev = lastLandMarks
    lastLandMarks = current;

    // 1回目は存在しないのでOK
    if (prev.length === 0) {
        return true
    }

    let totalDisplacement = 0;

    for (let i = 0; i < prev.length; i++) {

        const dx = current[i].x - prev[i].x;
        const dy = current[i].y - prev[i].y;
        const dz = (current[i].z || 0) - (prev[i].z || 0); // z軸も考慮

        totalDisplacement += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // 一貫性を判断するための閾値 (調整可能)
    return totalDisplacement < 20000; // 一定以上変化していないか
}


let firstVerticalHeight: number|null = null
function isVerticalMovementSignificant(
    keypoints: faceLandmarksDetection.Keypoint[]
): boolean {
    const lip = keypoints.find(k => k.name === "lips");
    const leftEye = keypoints.find(k => k.name === "leftEye");
    const rightEye = keypoints.find(k => k.name === "rightEye");

    if (!leftEye || !rightEye || !lip) {
        console.warn("Keypoints for vertical movement detection are missing.");
        return false;
    }

    // 縦方向の動きを計算（鼻先と目の中心の位置差）
    const verticalMovement = Math.abs(lip.y - (leftEye.y + rightEye.y) / 2);

    if (firstVerticalHeight === null) {
        firstVerticalHeight = verticalMovement
        return false;
    }

    // 動きが十分であれば true
    return Math.abs(verticalMovement - firstVerticalHeight) > 30; // 閾値は調整可能
}

let firstHorizontal: number|null = null
function isHorizontalMovementSignificant(
    keypoints: faceLandmarksDetection.Keypoint[]
): boolean {
    const leftEye = keypoints.find(k => k.name === "leftEye");
    const rightEye = keypoints.find(k => k.name === "rightEye");

    if (!leftEye || !rightEye) {
        console.warn("Keypoints for horizontal movement detection are missing.");
        return false;
    }

    // 横方向の動きを計算（左右の目の位置差）
    const horizontalMovement = Math.abs(leftEye.x - rightEye.x);
    if (firstHorizontal === null) {
        firstHorizontal = horizontalMovement;
        return false;
    }

    // 動きが十分であれば true
    return Math.abs(firstHorizontal - horizontalMovement) > 30; // 閾値は調整可能
}

