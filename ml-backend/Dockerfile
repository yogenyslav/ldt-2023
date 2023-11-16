FROM nvidia/cuda:12.3.0-base-ubuntu22.04
WORKDIR /app

RUN apt-get update
RUN apt-get install -y libglib2.0-0 ffmpeg libsm6 libxext6 python3.11-full
RUN apt-get -y install python3-pip

RUN pip install --upgrade pip
RUN pip install torch torchvision torchaudio

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY . .

CMD [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10003", "--workers", "13" ]