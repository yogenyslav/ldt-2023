import os
import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from ml import process, MlResult, base_path

load_dotenv(".env")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:10001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestData(BaseModel):
    videoId: int
    videoSource: str
    timeout: int = 0


class ResponseData(BaseModel):
    cadrs: list[MlResult]
    humans: list[MlResult]
    active: list[MlResult]
    processedSource: str


def directory_key(path: str):
    if path == "predict":
        return 0
    else:
        return int(path.replace(path, "predict", ""))


@app.post("/video")
async def process_video(data: RequestData):
    search_dir = f"{base_path}/static/processed/videos"
    dirs = set(os.listdir(search_dir))
    res = process(data.videoId, data.videoSource)
    new_dirs = set(os.listdir(search_dir))
    print(new_dirs.difference(dirs))
    processed_source = list(new_dirs.difference(dirs))[0]

    response = ResponseData(
        cadrs=res[0], humans=res[1], active=res[2], processedSource=processed_source
    ).model_dump_json()
    print(response)
    return response


@app.post("/stream")
async def process_stream(data: RequestData):
    process(data.videoId, data.videoSource, 45, rtsp=True)


@app.post("/frames")
async def process_frames(data: RequestData):
    cap = cv2.VideoCapture(f"{base_path}/{data.videoSource}")
    try:
        os.mkdir(f"{base_path}/static/frames/{data.videoId}")
    except Exception as e:
        print(str(e))

    count = 0
    frame = 0
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    while True:
        _, image = cap.read()

        if frame % (fps * 5) == 0:
            cv2.imwrite(
                f"{base_path}/static/frames/{data.videoId}/frame{count}.jpg", image
            )
            print(f"frame{count}")
            count += 1

        frame += 1
        if frame >= total_frames:
            break

    cap.release()
