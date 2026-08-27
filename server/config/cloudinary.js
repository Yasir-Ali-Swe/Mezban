import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.api_key || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.api_secret || process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer, folder = "mezban") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(fileBuffer);
  });
};

export default cloudinary;
