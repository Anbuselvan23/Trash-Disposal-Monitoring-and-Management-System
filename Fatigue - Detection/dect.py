import cv2
import mediapipe as mp
import numpy as np
import time
import streamlit as st
from PIL import Image
from playsound import playsound
import threading

# Initialize MediaPipe
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)

# Thresholds
EAR_THRESHOLD = 0.2  # Eye Aspect Ratio threshold for detecting closed eyes
CLOSED_EYE_DURATION = 2  # seconds
NO_FACE_DURATION = 3  # seconds for no face detection to add warning
warnings = 0
MAX_WARNINGS = 3
ROI_MARGIN = 100  # Width of the side borders
ALERT_SOUND = "alert.mp3"  # Path to the alert sound file

# EAR Calculation
def calculate_ear(eye_landmarks):
    p1, p2, p3, p4, p5, p6 = eye_landmarks
    vertical = np.linalg.norm(np.array(p2) - np.array(p6)) + np.linalg.norm(np.array(p3) - np.array(p5))
    horizontal = np.linalg.norm(np.array(p1) - np.array(p4))
    return vertical / (2.0 * horizontal)

# Function to play sound asynchronously
def play_alert_sound():
    threading.Thread(target=playsound, args=(ALERT_SOUND,), daemon=True).start()

# Streamlit setup
st.title('Fatigue Detection System')
st.sidebar.subheader("Controls")

# Initialize variables for Streamlit display
status_text = st.empty()
warning_text = st.empty()
image_placeholder = st.empty()

# Video capture
cap = cv2.VideoCapture(0)
eye_closed_start_time = None
no_face_start_time = None

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    h, w, _ = frame.shape
    left_limit = ROI_MARGIN
    right_limit = w - ROI_MARGIN
    cv2.rectangle(frame, (left_limit, 0), (right_limit, h), (255, 255, 255), 2)

    face_detection_results = face_detection.process(rgb_frame)
    face_mesh_results = face_mesh.process(rgb_frame)

    face_detected_within_roi = False
    eyes_open = True

    if face_detection_results.detections:
        for detection in face_detection_results.detections:
            bboxC = detection.location_data.relative_bounding_box
            x, y, w_bbox, h_bbox = (int(bboxC.xmin * w), int(bboxC.ymin * h),
                                    int(bboxC.width * w), int(bboxC.height * h))
            if left_limit <= x <= right_limit - w_bbox:
                face_detected_within_roi = True
                cv2.rectangle(frame, (x, y), (x + w_bbox, y + h_bbox), (0, 255, 0), 2)

    if face_detected_within_roi:
        no_face_start_time = None
    else:
        if no_face_start_time is None:
            no_face_start_time = time.time()
        elif time.time() - no_face_start_time > NO_FACE_DURATION:
            warnings += 1
            play_alert_sound()  # Play alert sound
            no_face_start_time = None

    if face_mesh_results.multi_face_landmarks:
        for face_landmarks in face_mesh_results.multi_face_landmarks:
            if face_detected_within_roi:
                landmarks = face_landmarks.landmark
                left_eye_points = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in [33, 160, 158, 133, 153, 144]]
                EAR = calculate_ear(left_eye_points)

                if EAR < EAR_THRESHOLD:
                    eyes_open = False
                    if eye_closed_start_time is None:
                        eye_closed_start_time = time.time()
                    elif time.time() - eye_closed_start_time > CLOSED_EYE_DURATION:
                        warnings += 1
                        play_alert_sound()  # Play alert sound
                        eye_closed_start_time = None
                else:
                    eye_closed_start_time = None

    if face_detected_within_roi and eyes_open:
        status_text.markdown("Face and Eye Open Detected")
    elif face_detected_within_roi and not eyes_open:
        status_text.markdown("Eyes Closed Detected")
    else:
        status_text.markdown("No Face Detected in ROI")

    warning_text.markdown(f"Warnings: {warnings}/{MAX_WARNINGS}")

    if warnings >= MAX_WARNINGS:
        status_text.markdown("Fatigue Detected! Exiting...")
        play_alert_sound()
        time.sleep(3)
        break

    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    image_placeholder.image(image, caption='Fatigue Detection', use_column_width=True)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

