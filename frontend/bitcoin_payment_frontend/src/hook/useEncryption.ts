import CryptoJS from "crypto-js";

const SECRET_KEY = "WASCSSF45#F";

export function encryptData(data: object): string {
  const jsonData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonData, SECRET_KEY).toString();
}

export function decryptData(ciphertext: string): any {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedText);
}
