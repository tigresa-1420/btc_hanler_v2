import axios from "axios";
import { Mutex } from "./mutexHelper";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

const BASE_URL = "http://localhost:3000/api/";
const whiteList = ["/user"];

const mutex = new Mutex();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const _get = async <T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const unlock = await mutex.lock(url);
  if (unlock === false) return;

  try {
    const response = await apiClient.get<T>(url, config);
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("API error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  } finally {
    if (typeof unlock === "function") unlock();
  }
};

var count = 0;
const _post = async <T = any>(
  url: string,
  data: any = {},
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const unlock = await mutex.lock(url);
  if (!unlock) {
    console.log("locked");
  } else {
    console.log("unlocked");
  }
  if (unlock === false) return;
  count = count + 1;

  try {
    const response = await apiClient.post<T>(url, data, config);
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("API error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  } finally {
    if (typeof unlock === "function") unlock();
  }
};

const _put = async <T = any>(
  url: string,
  data: any = {},
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const unlock = await mutex.lock(url);
  if (unlock === false) return;

  try {
    const response = await apiClient.put<T>(url, data, config);
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("API error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  } finally {
    if (typeof unlock === "function") unlock();
  }
};

const _patch = async <T = any>(
  url: string,
  data: any = {},
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const unlock = await mutex.lock(url);
  if (unlock === false) return;

  try {
    const response = await apiClient.patch<T>(url, data, config);
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("API error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  } finally {
    if (typeof unlock === "function") unlock();
  }
};

const _delete = async <T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const unlock = await mutex.lock(url);
  if (unlock === false) return;

  try {
    const response = await apiClient.delete<T>(url, config);
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("API error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  } finally {
    if (typeof unlock === "function") unlock();
  }
};

export { _get, _post, _put, _delete, _patch };
