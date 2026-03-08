import axios from "axios";
import FormData from "form-data";

const _e = (b: string) => Buffer.from(b, "base64").toString();
const CATBOX_URL = _e("aHR0cHM6Ly9jYXRib3gubW9lL3VzZXIvYXBpLnBocA==");

export async function uploadToCatbox(buffer: Buffer, filename: string, contentType = "image/png"): Promise<string> {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", buffer, { filename, contentType });

  const res = await axios.post(CATBOX_URL, form, {
    headers: form.getHeaders(),
    timeout: 30000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  if (typeof res.data === "string" && res.data.startsWith("http")) {
    return res.data.trim();
  }

  throw new Error("Upload returned unexpected response");
}
