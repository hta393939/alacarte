/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();
    }

    setListener() {
        {
            const el = document.getElementById('cap');
            el?.addEventListener('click', () => {
                this.startCapture();
            });
        }
    }

    async startCapture() {
        const opt = {
            audio: true,
            video: true,
        };
        const stream = await navigator.mediaDevices.getDisplayMedia(opt);
        window.mainvideo.srcObject = stream;
        await window.mainvideo.play();
    }

/**
 * https://docs.opencv.org/4.8.0/de/d67/group__objdetect__aruco.html
 */
    initializeAruco() {
        const dict = cv.getPredefinedDictionary(cv.DICT_6X6_1000);
        const charucoParam = new cv.aruco_CharucoParameters();
        const detectParam = new cv.aruco_DetectorParameters();
        const refineParam = new cv.aruco_RefineParameters(
            0.02, 0.02, true,
        );

        const bmat = new cv.Mat();
        const board = new cv.aruco_CharucoBoard(
            { width: 5, height: 7 }, 0.5, 0.3, dict, bmat,
        );

        const charucoCorners = new cv.Mat();
        const charucoCornerIds = new cv.Mat();

        const multiDetector = new cv.aruco_CharucoDetector(
            board, charucoParam, detectParam, refineParam,
        );

        const singleDetector = new cv.aruco_ArucoDetector(
            dict, detectParam, refineParam,
        );

        const image = cv.imread('mainvideo');
        const rgb = new cv.Mat();
        cv.cvtColor(image, rgb, cv.COLOR_RGBA2RGB, 0);

        {
            const markerCorners = new cv.MatVector();
            const markerIds = new cv.Mat();            
            multiDetector.detectBoard(rgb,
                charucoCorners, charucoCornerIds,
                markerCorners, markerIds,
            );
        }

        {
            const markerCorners = new cv.MatVector();
            const markerIds = new cv.Mat();
            singleDetector.detectMarkers(rgb,
                markerCorners,
                markerIds,
            );
        }

    }

}

const misc = new Misc();
misc.initialize();

var Module = {
    onRuntimeInitialized: () => {
        misc.initializeAruco();
    }
};

