package service

import (
	"bytes"
	"context"
	"encoding/json"
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
	// cli, _ := gocelery.NewCeleryClient(
	// 	gocelery.NewRedisBroker(redisPool),
	// 	&gocelery.RedisCeleryBackend{Pool: redisPool},
	// 	1,
	// )

	// taskName := "worker.get_frames"

	// asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	// if err != nil {
	// 	logging.Log.Errorf("failed to run the task: %s", err)
	// 	return
	// }

	// res, err := asyncResult.Get(1 * time.Hour)
	// if err != nil {
	// 	logging.Log.Errorf("failed to get task result: %s", err)
	// 	return
	// }

	// logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))

	data := MlRequest{
		VideoId:     videoId,
		VideoSource: videoSource,
	}
	body, err := json.Marshal(&data)
	if err != nil {
		logging.Log.Errorf("failed to marshal ml request: %s", err)
		return
	}
	r, err := http.Post(config.Cfg.MlHost+"/frames", "application/json", bytes.NewBuffer(body))
	if err != nil {
		logging.Log.Errorf("failed to send ml request: %s", err)
		return
	}

	if r.StatusCode != http.StatusOK {
		logging.Log.Errorf("ml request returned status code %d", r.StatusCode)
		return
	}
}

func ProcessVideoMl(videoId int, videoSource, fileName string, videoRepo model.VideoRepository, mlFrameRepo model.MlFrameRepository) {
	// cli, _ := gocelery.NewCeleryClient(
	// 	gocelery.NewRedisBroker(redisPool),
	// 	&gocelery.RedisCeleryBackend{Pool: redisPool},
	// 	1,
	// )

	// taskName := "worker.process_video"

	// asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	// if err != nil {
	// 	logging.Log.Errorf("failed to run the task: %s", err)
	// 	return
	// }

	// res, err := asyncResult.Get(1 * time.Hour)
	// if err != nil {
	// 	logging.Log.Errorf("failed to get task result: %s", err)
	// 	return
	// }

	// logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))

	// var resp MlResult
	// if err := json.Unmarshal([]byte(res.(string)), &resp); err != nil {
	// 	logging.Log.Errorf("failed to unmarshal ml result: %s", err)
	// 	return
	// }

	data := MlRequest{
		VideoId:     videoId,
		VideoSource: videoSource,
	}
	body, err := json.Marshal(&data)
	if err != nil {
		logging.Log.Errorf("failed to marshal ml request: %s", err)
		return
	}
	r, err := http.Post(config.Cfg.MlHost+"/video", "application/json", bytes.NewBuffer(body))
	if err != nil {
		logging.Log.Errorf("failed to send ml request: %s", err)
		return
	}

	if r.StatusCode != http.StatusOK {
		logging.Log.Errorf("ml request returned status code %d", r.StatusCode)
		return
	}

	var resp MlResult
	if err := json.NewDecoder(r.Body).Decode(&resp); err != nil {
		logging.Log.Errorf("failed to unmarshal ml result: %s", err)
		return
	}

	c := context.Background()
	if len(resp.Cadrs) != 0 {
		logging.Log.Debug("inserting cadrs ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Cadrs); err != nil {
			logging.Log.Errorf("failed to insert cadrs ml frames: %s", err)
			return
		}
	}
	if len(resp.Humans) != 0 {
		logging.Log.Debug("inserting humans ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Humans); err != nil {
			logging.Log.Errorf("failed to insert humans ml frames: %s", err)
			return
		}
	}
	if len(resp.Active) != 0 {
		logging.Log.Debug("inserting active ml frames")
		if err := mlFrameRepo.InsertMany(c, resp.Active); err != nil {
			logging.Log.Errorf("failed to insert active ml frames: %s", err)
			return
		}
	}

	fileName = strings.ReplaceAll(fileName, " ", "_")
	resp.ProcessedSource = strings.ReplaceAll(resp.ProcessedSource, " ", "_")

	path := "static/processed/videos/" + resp.ProcessedSource
	fileNameAvi := strings.Replace(fileName, ".mp4", ".avi", 1)
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
}

func ProcessStream(videoId int, videoSource string, timeout int) {
	// cli, _ := gocelery.NewCeleryClient(
	// 	gocelery.NewRedisBroker(redisPool),
	// 	&gocelery.RedisCeleryBackend{Pool: redisPool},
	// 	1,
	// )

	// taskName := "worker.process_stream"

	// asyncResult, err := cli.Delay(taskName, videoId, videoSource)
	// if err != nil {
	// 	logging.Log.Errorf("failed to run the task: %s", err)
	// 	return
	// }

	// res, err := asyncResult.Get(1 * time.Second)
	// if err != nil {
	// 	logging.Log.Errorf("failed to get task result: %s", err)
	// 	return
	// }

	// logging.Log.Debugf("result: %+v of type %+v", res, reflect.TypeOf(res))

	data := MlRequest{
		VideoId:     videoId,
		VideoSource: videoSource,
		Timeout:     timeout,
	}
	body, err := json.Marshal(&data)
	if err != nil {
		logging.Log.Errorf("failed to marshal ml request: %s", err)
		return
	}

	r, err := http.Post(config.Cfg.MlHost+"/stream", "application/json", bytes.NewBuffer(body))
	if err != nil {
		logging.Log.Errorf("failed to send ml request: %s", err)
		return
	}

	if r.StatusCode != http.StatusOK {
		logging.Log.Errorf("ml request returned status code %d", r.StatusCode)
		return
	}
}
