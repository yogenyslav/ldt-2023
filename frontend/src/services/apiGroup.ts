import axios from "axios";
import { BASE_URL } from '../config';
import { config } from "./apiConfig";


interface CreateGroupData {
    title: string;
}

interface GetAllGroupsData {
    limit: number;
}

const ApiGroup = {

    async createGroup(data: CreateGroupData) {
        return await axios
            .post(`${BASE_URL}/v1/groups`, { title: data.title }, config);
    },
    async getAllGroups(data: GetAllGroupsData) {
        return await axios.get(`${BASE_URL}/v1/groups?offset=0&limit=${data.limit}`, config);
    },
    async deleteGroup(groupId: number) {
        return await axios.delete(`${BASE_URL}/v1/groups/${groupId}`, config);
    },
};
export default ApiGroup;