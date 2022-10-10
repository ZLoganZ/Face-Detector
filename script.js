const container = document.querySelector('#container');
const fileInput = document.querySelector('#file-input');


async function loadTrainingData() {
    const labels = ['Emma Watson', 'Tom Holland', 'Robert Downey Jr', 'Mark Wahlberg', 'Sơn Tùng MTP']

    const faceDescriptors = []
    for (const label of labels) {
        const descriptors = []
        for (let i = 1; i <= 25; i++) {
            const image = await faceapi.fetchImage(`/Face-Detector/data/${label}/${i}.jpeg`)
            const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
            descriptors.push(detection.descriptor)
        }
        faceDescriptors.push(new faceapi.LabeledFaceDescriptors(label, descriptors))
        Toastify({
            text: `Nhận diện xong khuôn mặt của ${label}!`
        }).showToast();
    }

    return faceDescriptors
}

let faceMatcher
async function init() {
    await Promise.all([
        faceapi.loadSsdMobilenetv1Model('/Face-Detector/models'),
        faceapi.loadFaceRecognitionModel('/Face-Detector/models'),
        faceapi.loadFaceLandmarkModel('/Face-Detector/models'),
    ])

    const trainingData = await loadTrainingData()
    faceMatcher = new faceapi.FaceMatcher(trainingData)

    Toastify({
        text: "Hệ thống nhận diện đã sẵn sàng!",
    }).showToast();

    console.log(faceMatcher)
    document.querySelector("#loading").remove();
}

init()

fileInput.addEventListener('change', async(e) => {
    const files = fileInput.files;

    const image = await faceapi.bufferToImage(files[0]);
    const canvas = faceapi.createCanvasFromMedia(image);

    container.innerHTML = ''
    container.append(image);
    container.append(canvas);

    const size = {
        width: image.width,
        height: image.height
    }

    faceapi.matchDimensions(canvas, size)

    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, size)

    for (const detection of resizedDetections) {
        const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
            label: faceMatcher.findBestMatch(detection.descriptor).toString()
        })
        drawBox.draw(canvas)
    }
})