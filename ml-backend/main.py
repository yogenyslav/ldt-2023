import os
import cv2
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from ml import process, MlResult, base_path

load_dotenv(".env")


router = APIRouter(prefix="ml")


class RequestData(BaseModel):
    video_id: int
    video_source: str
    timeout: int = 0


class ResponseData(BaseModel):
    cadrs: list[MlResult]
    humans: list[MlResult]
    active: list[MlResult]
    processedSource: str


@router.post("/video")
async def process_video(data: RequestData):
    res = process(data.video_id, data.video_source)

    processed_source = os.listdir(f"{base_path}/static/processed/videos")
    processed_source.sort()
    return ResponseData(
        cadrs=res[0], humans=res[1], active=res[2], processedSource=processed_source[-1]
    ).model_dump_json()


@router.post("/stream")
async def process_stream(data: RequestData):
    process(data.video_id, data.video_source, data.timeout, rtsp=True)


@router.post("/frames")
async def process_frames(data: RequestData):
    cap = cv2.VideoCapture(f"{base_path}/{data.video_source}")
    try:
        os.mkdir(f"{base_path}/static/frames/{data.video_id}")
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
                f"{base_path}/static/frames/{data.video_id}/frame{count}.jpg", image
            )
            print(f"frame{count}")
            count += 1

        frame += 1
        if frame >= total_frames:
            break

    cap.release()


def create_app() -> FastAPI:
    _app = FastAPI()
    _app.add_middleware(
        CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
    )
