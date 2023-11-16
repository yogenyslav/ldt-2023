import axios from "axios";
import { config } from "./apiConfig";
import { BASE_URL } from '../config';

interface CreateCameraData {
    groupId: number;
    url: string;
    uuid: string;
}

interface updateStreamGroupdata {
    action: string;
    cameraUuid: string;
    groupId: number;
}

const ApiCamera = {

    async getCameraData(streamId: string) {
        return await axios.get(`${BASE_URL}/api/v1/cameras/${streamId}`, config);
    },
    async getCameraMlFrames(streamId: string) {
        return await axios.get(`${BASE_URL}/api/v1/cameras/${streamId}/frames`, config);
    },
    async createCamera(data: CreateCameraData) {    
        return await axios.post(`${BASE_URL}/api/v1/cameras`, data, config);
    },
    async updateCameraGroup(data: updateStreamGroupdata) {

        return await axios.post(`${BASE_URL}/api/v1/cameras/updateGroup`, data,config);
    },
    async deleteCamera(streamId: string) {
        return await axios.delete(`${BASE_URL}/api/v1/cameras/${streamId}`, config);
    },
};
export default ApiCamera;