import axios from 'axios';
const CustomAxios = axios;
CustomAxios.interceptors.request.use(
    function (config: any) {
        config.metadata = { startTime: new Date() };
        return config;
    },
    function (error) {
        return Promise.reject(error);
    },
);

CustomAxios.interceptors.response.use(
    function (response: any) {
        response.config.metadata.endTime = new Date();
        response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
        return response;
    },
    function (error) {
        error.config.metadata.endTime = new Date();
        error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
        return Promise.reject(error);
    },
);
export default CustomAxios;
