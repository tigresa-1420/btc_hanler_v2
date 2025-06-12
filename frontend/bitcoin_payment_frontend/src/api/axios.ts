import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { Mutex } from "./mutexHelper";
import { decryptData, encryptData } from "src/hook/useEncryption";


const BASE_URL = "http://localhost:3000/api";
const mutex = new Mutex();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

type EncryptedResponse = {
  data: string;
  iv: string;
};

const _get = async <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T> | undefined> => {
  const isLockAcquired = await mutex.lock(url);
  if (!isLockAcquired) return;
  try {
    const response = await apiClient.get<T>(url, config);
    return response;
  } catch (error) {
    console.error(error);
  } finally {
    mutex.unlock(url);
  }
};

const _post = async <T = any>(
  url: string,
  data: any,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const isLockAcquired = await mutex.lock(url);
  if (!isLockAcquired) return;

  try {
    const encrypted = encryptData(data);
    const response = await apiClient.post(url, encrypted, config);

    if (response.data?.data && response.data?.iv) {
      const decrypted = decryptData(response.data.data, response.data.iv) as T;


      response.data = decrypted;

      return response;
    }

    return response;
  } catch (error) {
    console.error(error);
  } finally {
    mutex.unlock(url);
  }
};


const _delete = async <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T> | undefined> => {
  const isLockAcquired = await mutex.lock(url);
  if (!isLockAcquired) return;
  try {
    const response = await apiClient.delete<T>(url, config);
    return response;
  } catch (error) {
    console.error(error);
  } finally {
    mutex.unlock(url);
  }
};

const _put = async <T = any>(
  url: string,
  data: any = {},
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const isLockAcquired = await mutex.lock(url);
  if (!isLockAcquired) return;
  try {
    const encrypted = encryptData(data);

    const response = await apiClient.put(url, encrypted, config);

    if (response.data?.data && response.data?.iv) {
      const decrypted = decryptData(response.data.data, response.data.iv) as T;


      response.data = decrypted;

      return response;
    }
    return response;
  } catch (error) {
    console.error(error);
  } finally {
    mutex.unlock(url);
  }
};


const _patch = async <T = any>(
  url: string,
  data: any = {},
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T> | undefined> => {
  const isLockAcquired = await mutex.lock(url);
  if (!isLockAcquired) return

  try {
    const encrypted = encryptData(data);

    const response = await apiClient.patch(url, encrypted, config);

    if (response.data?.data && response.data?.iv) {
      const decrypted = decryptData(response.data.data, response.data.iv) as T;


      response.data = decrypted;

      return response;
    }
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("API error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  } finally {
    mutex.unlock(url)
  }
};
export { _get, _post, _delete, _put, _patch };
