import { STREAM_URL } from '../config'
import axios from "axios";

type Channel = {
    url: string;
    on_demand: boolean;
    debug: boolean;
};


interface CreateStreamData {
    name: string;
    channels: {
        [key: string]: Channel;
    };
}

const config = {
    headers: {
        "ngrok-skip-browser-warning": 'lets go'
    }
  }

const ApiStream = {

    async createStream(data: CreateStreamData, uuid: string) {
        return await axios.post(`${STREAM_URL}/stream/${uuid}/add`, data, config);
    },
    async getAllStreams() {
        return await axios.get(`${STREAM_URL}/streams`, config);
    },
    async getStreamInfo(stream_id: string) {
        return await axios.get(`${STREAM_URL}/stream/${stream_id}/info`, config);
    },
    async deleteStream(stream_id: string) {
        return await axios.get(`${STREAM_URL}/stream/${stream_id}/delete`, config);
    },
};
export default ApiStream;