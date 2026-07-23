import axios from "axios";

const REMOTE_API_ORIGIN = "https://campus-bridge-lms.onrender.com";
const LOCAL_API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "http://localhost:5000";

const isLocalFrontend = () => {
    if (typeof window === "undefined") return false;
    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
};

if (!axios.__campusBridgeApiRewriteInstalled) {
    axios.interceptors.request.use((config) => {
        if (
            isLocalFrontend() &&
            typeof config.url === "string" &&
            config.url.startsWith(REMOTE_API_ORIGIN)
        ) {
            return {
                ...config,
                url: config.url.replace(REMOTE_API_ORIGIN, LOCAL_API_ORIGIN)
            };
        }

        return config;
    });

    axios.__campusBridgeApiRewriteInstalled = true;
}

export const API_ORIGIN = isLocalFrontend() ? LOCAL_API_ORIGIN : REMOTE_API_ORIGIN;
export const API_BASE_URL = `${API_ORIGIN}/api`;
