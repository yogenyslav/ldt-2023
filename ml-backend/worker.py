import os
import cv2
from celery import Celery
from pydantic import BaseModel
from ml import process, MlResult
from dotenv import load_dotenv

load_dotenv(".env")

app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

app.conf.update(
    CELERY_TASK_SERIALIZER="json",
    CELERY_ACCEPT_CONTENT=["json"],
    CELERY_RESULT_SERIALIZER="json",
    CELERY_ENABLE_UTC=True,
    CELERY_TASK_PROTOCOL=1,
    WORKER_LOST_WAIT=60 * 5,
)


class Response(BaseModel):
    cadrs: list[MlResult]
    humans: list[MlResult]
    active: list[MlResult]
    processedSource: str


@app.task
def process_video(video_id: int, video_source: str):
    print("starting process_video")
    res = process(video_id, video_source)

    processed_source = os.listdir("../static/processed/videos")
    processed_source.sort()
    return Response(
        cadrs=res[0], humans=res[1], active=res[2], processedSource=processed_source[-1]
    ).model_dump_json()


@app.task
def process_stream(video_id: int, video_source: str):
    print("starting process_stream")
    print(f"video source {video_source}")

    process(video_id, video_source, rtsp=True)

    return


@app.task
def get_frames(video_id: int, video_source: str):
    print(f"video_id: {video_id}")
    cap = cv2.VideoCapture(f"../{video_source}")
    try:
        os.mkdir(f"../static/frames/{video_id}")
    except Exception as e:
        print(str(e))

    count = 0
    frame = 0
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    while True:
        _, image = cap.read()

        if frame % (fps * 5) == 0:
            cv2.imwrite(f"../static/frames/{video_id}/frame{count}.jpg", image)
            print(f"frame{count}")
            count += 1

        frame += 1
        if frame >= total_frames:
            break

    cap.release()
    return count
