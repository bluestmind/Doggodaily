import axios from "axios";

const api = axios.create({
  baseURL: "http://46.101.244.203:5000/api", // Updated to production server
  withCredentials: true,
});

export default api; 