import storage from "../utils/storage";

export const config = {
  headers: {
      Authorization: `Bearer ${storage.getToken()}`,
      "ngrok-skip-browser-warning": 'lets go'
  }
}