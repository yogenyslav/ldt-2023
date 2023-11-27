import axios from "axios";
import { BASE_URL } from '../config';
import { IArea } from '@bmunozg/react-image-area'
import { config } from "./apiConfig";


interface InputObject extends IArea {
    classId: number;
    [key: string]: any;
}

function dataURLtoFile(dataurl: string, filename: string) {
    var arr = dataurl.split(','), 
        mimeMatches = arr[0].match(/:(.*?);/);
        
    if (mimeMatches === null) {
        throw new Error('Invalid data URL');
    }
    
    var mime = mimeMatches[1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
        
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, {type:mime});
}

const ApiFrames = {

    async sendFrames(data: InputObject, videoId: string, frame: string) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key !== 'isChanging' && key !== 'isNew' && key !== 'unit') {
                formData.append(key, data[key]);
            }
        });
        formData.append('videoId', videoId);
        formData.append('frame', dataURLtoFile(frame, 'frame'));
        return await axios
            .post(`${BASE_URL}/v1/frames/learn`, formData, config)
    },
    async putRejectFrames(frameId: number) {
        return await axios.put(`${BASE_URL}/v1/frames/ml/reject/${frameId}`, config);
    },
};
export default ApiFrames;