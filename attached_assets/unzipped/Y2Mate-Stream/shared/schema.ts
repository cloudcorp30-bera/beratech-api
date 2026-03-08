import { z } from "zod";

export const convertRequestSchema = z.object({
  url: z.string().url("Please provide a valid YouTube URL"),
  format: z.enum(["mp3", "mp4"]),
  quality: z.string().optional(),
});

export type ConvertRequest = z.infer<typeof convertRequestSchema>;

export interface ConvertResult {
  status: number;
  success: boolean;
  creator: string;
  result: {
    youtube_id: string;
    quality: string;
    title: string;
    thumbnail: string;
    message: string;
    download_url: string;
  };
}

export interface ConvertError {
  status: number;
  success: false;
  creator: string;
  error: string;
}
