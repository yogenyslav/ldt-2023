import random
import numpy as np
import torch
import time
from ultralytics import RTDETR
from ultralytics import YOLO
import cv2
from pydantic import BaseModel
import os
from src.detect_stationary import save_cadrs
from src.detect_human_stationary import post_processing
from src.dbscan_moving import moving_count, otbor
from src.track_stream import save_cadrs as save_cadrs_stream, check_person
from src.dbscan_stream import moving_stream

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

names = {0: "animal", 1: "balloon", 2: "cart", 3: "person"}
base_path = ".."


class MlResult(BaseModel):
    fileName: list
    videoId: int
    timeCode: float
    timeCodeMl: float
    detectedClassId: int


def process(video_id: int, video_path: str, timeout: int, rtsp: bool = False):
    model = YOLO("weights/model.pt")
    model_predictor = RTDETR("weights/model_predictor.pt")
    model_cart = YOLO("weights/yolov8n.pt")

    if rtsp:
        try:
            os.mkdir(f"{base_path}/static/processed/s_frames/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"{base_path}/static/processed/s_frames_h/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"{base_path}/static/processed/s_frames_a/{video_id}")
        except Exception as e:
            print(str(e))

        time_start = time.time()
        with torch.no_grad():
            results = model.track(
                source=video_path,
                # save=True,
                stream=True,
                tracker="bytetrack.yaml",
                classes=[1, 2, 3],
                device=0,
            )
            num_frame = 0
            for res in results:
                if timeout > 0 and time.time() - time_start >= timeout:
                    return
                num_frame += 1
                objects = {}
                people = {}
                print("Кадр обрабатывается")
                saved = save_cadrs_stream(
                    res,
                    model_predictor,
                    model_cart,
                    save_path=f"{base_path}/static/processed/s_frames/{video_id}",
                    num_frame=num_frame,
                    objects=objects,
                ).values()
                """
                if len(saved) > 0:
                    for key in saved:
                        # print(f"TimeCode - {saved[key].timestamp}")
                        # print(f"TimeCodeML - {saved[key].timestampML}")
                        print(f"FileName - {saved[key].path}")
                        # print(f"DetectedClassId - {saved[key].cls}")
                """

                human_saved = check_person(
                    res,
                    num_frames=num_frame,
                    people=people,
                    save_path=f"{base_path}/static/processed/s_frames_h/{video_id}",
                ).values()

                actives = {}
                active_saved = moving_stream(
                    res,
                    num_frames=num_frame,
                    objects3=actives,
                    save_path=f"{base_path}/static/processed/s_frames_a/{video_id}",
                ).values()

    else:
        cap = cv2.VideoCapture(f"{base_path}/{video_path}")
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_cnt = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration = frame_cnt / fps

        times = {120: 3, 300: 20, 600: 40}

        vid_stride = 5
        for i in times.keys():
            if duration <= i:
                vid_stride = times[i]
                break
            if i == 600:
                vid_stride = 40
                break

        frames = []
        with torch.no_grad():
            results = model.track(
                source=f"{base_path}/{video_path}",
                save=True,
                stream=True,
                tracker="bytetrack.yaml",
                classes=[1, 2, 3],
                vid_stride=vid_stride,
                project=f"{base_path}/static/processed/videos",
                device=0,
            )
            for res in results:
                frames.append(res)

        try:
            os.mkdir(f"{base_path}/static/processed/frames/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"{base_path}/static/processed/frames_a/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"{base_path}/static/processed/frames_h/{video_id}")
        except Exception as e:
            print(str(e))

        saved = save_cadrs(
            # video_id=1,
            result_after_track=frames,
            model_predictor=model_predictor,
            model_cart=model_cart,
            fps=fps,
            vid_stride=vid_stride,
            save_path=f"{base_path}/static/processed/frames/{video_id}",
        )

        savedModels = [
            MlResult(
                fileName=[path.replace("{base_path}/", "") for path in obj.path],
                videoId=video_id,
                detectedClassId=obj.cls,
                timeCode=obj.timestamp,
                timeCodeMl=obj.timestampML,
            )
            for obj in saved
        ]

        """
        if len(saved) > 0:
            for save in saved:
                print(f"TimeCode - {save.timestamp}")
                print(f"TimeCodeML - {save.timestampML}")
                print(f"FileName - {save.path}")
                print(f"DetectedClassId - {save.cls}")
        """

        humanModels = []
        if duration > 60:
            human_saved = post_processing(
                frames,
                fps,
                vid_stride,
                save_path=f"{base_path}/static/processed/frames_h/{video_id}",
            )
            humanModels = [
                MlResult(
                    fileName=[path.replace("../", "") for path in obj.path],
                    videoId=video_id,
                    timeCode=obj.timestamp,
                    timeCodeMl=obj.timestampML,
                    detectedClassId=obj.cls,
                )
                for obj in human_saved.values()
            ]

        """
        if len(human_saved) > 0:
            for key in human_saved:
                print(f"TimeCode - {human_saved[key].timestamp}")
                print(f"TimeCodeML - {human_saved[key].timestampML}")
                print(f"FileName - {human_saved[key].path}")
                print(f"DetectedClassId - {human_saved[key].cls}")
        """

        objects_active = moving_count(frames, fps=fps, vid_stride=vid_stride)
        active_saved = otbor(
            objects_active,
            save_path=f"{base_path}/static/processed/frames_a/{video_id}",
        )
        activeModels = [
            MlResult(
                fileName=[path.replace("../", "") for path in obj.path],
                videoId=video_id,
                timeCode=obj.timestamp,
                timeCodeMl=obj.timestampML,
                detectedClassId=obj.cls,
            )
            for obj in active_saved
        ]

        return savedModels, humanModels, activeModels
