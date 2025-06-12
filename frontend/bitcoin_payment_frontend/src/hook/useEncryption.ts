import CryptoJS from 'crypto-js';

const SECRET_KEY = 'WASCSSF45#F';
const KEY = CryptoJS.SHA256(SECRET_KEY); // 32-byte key derivada
var in_iv

export function encryptData(data: object) {
  const iv = CryptoJS.lib.WordArray.random(16); // 16-byte IV
  in_iv = iv;
  const jsonData = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonData, KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    data: encrypted.toString(), // base64
    iv: CryptoJS.enc.Base64.stringify(iv)
  };
}

export function decryptData(encryptedData: string, ivBase64: string) {
  const iv = CryptoJS.enc.Base64.parse(ivBase64);

  const decrypted = CryptoJS.AES.decrypt(encryptedData, KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

  return JSON.parse(decryptedText);
}



export function encryptClient(data: object): string {
  const jsonData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonData, SECRET_KEY).toString();
}

export function decryptClient(ciphertext: string): any {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedText);
}