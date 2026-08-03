import axios, {AxiosInstance} from 'axios';

export function useApi() {

    const headers = {
        "Content-Type": "application/json"
    }

    const api : AxiosInstance = axios.create({
        headers
    })
    
    return api 
}