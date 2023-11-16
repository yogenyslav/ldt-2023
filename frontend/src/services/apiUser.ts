import axios from "axios";
import { BASE_URL } from '../config';
import { config } from "./apiConfig";

interface CreateUserData {
    email: string;
    firstName: string;
    groupId: number;
    lastName: string;
    role: "viewer" | "admin";
}

interface GetAllUsersData {
    limit: number;
    offset: number;
}

interface updateUserGroupdata {
    action: string;
    userId: number;
    groupId: number;
}

const ApiUser = {

    async createUser(data: CreateUserData) {
        return await axios
            .post(`${BASE_URL}/api/v1/users`, data , config);
    },
    async getAllUsers(data: GetAllUsersData) {
        return await axios.get(`${BASE_URL}/api/v1/users?offset=${data.offset}&limit=${data.limit}`, config);
    },
    async updateUserGroup(data: updateUserGroupdata) {
        return await axios.post(`${BASE_URL}/api/v1/users/updateGroup`, data,config);
    },
    async deleteUser(userId: number) {
        return await axios.delete(`${BASE_URL}/api/v1/users/${userId}`, config);
    },
};
export default ApiUser;