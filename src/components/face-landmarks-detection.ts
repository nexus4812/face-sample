import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';
import {FaceLandmarksDetector} from "@tensorflow-models/face-landmarks-detection/dist/face_landmarks_detector";
import {Keypoint} from "@tensorflow-models/face-landmarks-detection";


export async function execute(videoElement: HTMLVideoElement): Promise<void> {
    const model = await createModel();
    setInterval(() => {
        detectFaceMovement(videoElement, model);
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

// 右目と左目の動きを特定するサンプル
export async function detectFaceMovement(videoElement: HTMLVideoElement, model: FaceLandmarksDetector) {

    // 動画フレームから顔のランドマークを推定
    const predictions = await model.estimateFaces(videoElement);

    if (predictions.length > 0) {
        const landmarks = predictions[0].keypoints; // ランドマーク情報

        // 必要なランドマークを取得
        const leftEye: Keypoint = landmarks.find(l => l.name === 'leftEye')!;
        const rightEye: Keypoint = landmarks.find(l => l.name === 'rightEye')!;

        if (leftEye === null || rightEye === null) {
            return false;
        }

        console.log('Left Eye:', leftEye);
        console.log('Right Eye:', rightEye);

        // 顔の動きや位置を確認
        // 例: 左右の目の位置の差で顔の動きを検出
        const movementThreshold = 5;
        let movementDetected = false;

        if (Math.abs(leftEye.x - rightEye.x) > movementThreshold) {
            movementDetected = true;
        }

        if (movementDetected) {
            console.log('Face movement detected!');
        } else {
            console.log('No significant face movement detected.');
        }
    } else {
        console.log('No faces detected.');
    }
}
