package service

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"lct/internal/config"
	"lct/internal/logging"
	"lct/internal/model"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

type MlResult struct {
	Cadrs           []model.MlFrameCreate `json:"cadrs"`
	Humans          []model.MlFrameCreate `json:"humans"`
	Active          []model.MlFrameCreate `json:"active"`
	ProcessedSource string                `json:"processedSource"`
}

type MlRequest struct {
	VideoId     int    `json:"videoId"`
	VideoSource string `json:"videoSource"`
	Timeout     int    `json:"timeout"`
}

func ProcessVideoFrames(videoId int, videoSource string) {
	data := MlRequest{
		VideoId:     videoId,
		VideoSource: videoSource,
	}
	body, err := json.Marshal(&data)
	if err != nil {
		logging.Log.Errorf("failed to marshal ml frames request: %s", err)
		return
	}
	r, err := http.Post(config.Cfg.MlHost+"/frames", "application/json", bytes.NewBuffer(body))
	if err != nil {
		logging.Log.Errorf("failed to send ml frames request: %s", err)
		return
	}

	if r.StatusCode != http.StatusOK {
		logging.Log.Errorf("ml frames status code %d", r.StatusCode)
		return
	}

	logging.Log.Debug("processing frames successfuly")
}

func ProcessVideoMl(videoId int, videoSource, fileName string, videoRepo model.VideoRepository, mlFrameRepo model.MlFrameRepository) {
	data := MlRequest{
		VideoId:     videoId,
		VideoSource: videoSource,
	}
	body, err := json.Marshal(&data)
	if err != nil {
		logging.Log.Errorf("failed to marshal ml video request: %s", err)
		return
	}
	r, err := http.Post(config.Cfg.MlHost+"/video", "application/json", bytes.NewBuffer(body))
	if err != nil {
		logging.Log.Errorf("failed to send ml video request: %s", err)
		return
	}
	defer r.Body.Close()

	if r.StatusCode != http.StatusOK {
		logging.Log.Errorf("ml video request returned status code %d", r.StatusCode)
		return
	}

	var resp MlResult
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		return
	}
	rawFixed := string(raw)
	rawFixed = rawFixed[1 : len(rawFixed)-1]
	rawFixed = strings.ReplaceAll(rawFixed, "\\", "")
	logging.Log.Debug(rawFixed)
	if err := json.Unmarshal([]byte(rawFixed), &resp); err != nil {
		logging.Log.Errorf("failed to unmarshal ml video result: %s", err)
		return
	}

	c := context.Background()
	if len(resp.Cadrs) != 0 {
		logging.Log.Debug("inserting cadrs ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Cadrs); err != nil {
			logging.Log.Errorf("failed to insert cadrs ml video frames: %s", err)
			return
		}
	}
	if len(resp.Humans) != 0 {
		logging.Log.Debug("inserting humans ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Humans); err != nil {
			logging.Log.Errorf("failed to insert humans ml video frames: %s", err)
			return
		}
	}
	if len(resp.Active) != 0 {
		logging.Log.Debug("inserting active ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Active); err != nil {
			logging.Log.Errorf("failed to insert active ml video frames: %s", err)
			return
		}
	}

	fileName = strings.ReplaceAll(fileName, " ", "_")
	resp.ProcessedSource = strings.ReplaceAll(resp.ProcessedSource, " ", "_")

	path := "static/processed/videos/" + resp.ProcessedSource
	fileNameAvi := strings.Replace(fileName, ".mp4", ".avi", 1)
	fileNameAvi = strings.Replace(fileName, ".MP4", ".avi", 1)
	if _, err := os.Stat(path + "/" + fileNameAvi); os.IsNotExist(err) {
		logging.Log.Debugf("file %s does not exist", path+"/"+fileNameAvi)
	} else {
		// ffmpeg -i file.avi -c:v libx264 -pix_fmt yuv420p file.mp4
		cmd := exec.Command("ffmpeg", "-i", path+"/"+fileNameAvi, "-c:v", "libx264", "-pix_fmt", "yuv420p", path+"/"+fileName)
		if err := cmd.Run(); err != nil {
			logging.Log.Errorf("failed to convert video to mp4: %s", err)
			return
		}
	}

	if err := videoRepo.SetCompleted(c, videoId, path+"/"+fileName); err != nil {
		logging.Log.Errorf("failed to set video status as processed: %s", err)
		return
	}

	logging.Log.Debug("processing video successfuly")
}

func ProcessStream(videoId int, videoSource string, timeout int) {
	data := MlRequest{
		VideoId:     videoId,
		VideoSource: videoSource,
		Timeout:     timeout,
	}
	body, err := json.Marshal(&data)
	if err != nil {
		logging.Log.Errorf("failed to marshal ml stream request: %s", err)
		return
	}

	r, err := http.Post(config.Cfg.MlHost+"/stream", "application/json", bytes.NewBuffer(body))
	if err != nil {
		logging.Log.Errorf("failed to send ml stream request: %s", err)
		return
	}

	if r.StatusCode != http.StatusOK {
		logging.Log.Errorf("ml request returned status code %d", r.StatusCode)
		return
	}

	logging.Log.Debug("processing stream successfuly")
}
