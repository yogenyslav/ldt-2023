import axios from "axios";
import { BASE_URL } from '../config';
import { config } from "./apiConfig";


interface GetAllVideosData {
    limit: number;
    offset: number;
}

interface GetAllVideosDataFilter {
    limit: number;
    offset: number;
    groupId: number;
}

interface CreateVideoData {
    file: File;
    title: string;
    groupId: number;
}

interface updateVideoGroupdata {
    action: string;
    videoId: number;
    groupId: number;
}

interface getVideoFrames {
    videoId: string;
    type: string;
}

const ApiVideo = {

    async getAllVideos(data: GetAllVideosData) {
        return await axios.get(`${BASE_URL}/api/v1/videos?offset=${data.offset}&limit=${data.limit}`, config);
    },
    async getAllVideosFilter(data: GetAllVideosDataFilter) {
        return await axios.get(`${BASE_URL}/api/v1/videos?filter=groupId&value=${data.groupId}&offset=${data.offset}&limit=${data.limit}`, config);
    },
    async getVideoData(videoId: string) {
        return await axios.get(`${BASE_URL}/api/v1/videos/${videoId}`, config);
    },
    async getVideoFrames(data: getVideoFrames) {
        return await axios.get(`${BASE_URL}/api/v1/videos/${data.videoId}/frames/?type=${data.type}`, config);
    },
    async getVideoMlFrames(videoId: string) {
        return await axios.get(`${BASE_URL}/api/v1/frames/ml/${videoId}`, config);
    },
    async createOneVideo(data: CreateVideoData) {
        const formData = new FormData();
        formData.append('video', data.file); 
        formData.append('title', data.title); 
        formData.append('groupId', data.groupId.toString());
    
        return await axios.post(`${BASE_URL}/api/v1/videos`, formData, config);
    },
    async createVideosAll(data: CreateVideoData) {
        
    
        const formData = new FormData();
        formData.append('archive', data.file); 
        formData.append('title', data.title); 
        formData.append('groupId', data.groupId.toString());
    
        return await axios.post(`${BASE_URL}/api/v1/videos/many`, formData, config);
    },
    async updateVideoGroup(data: updateVideoGroupdata) {

        return await axios.post(`${BASE_URL}/api/v1/videos/updateGroup`, data,config);
    },
    async deleteVideo(videoId: number) {
        return await axios.delete(`${BASE_URL}/api/v1/videos/${videoId}`, config);
    },
};
export default ApiVideo;