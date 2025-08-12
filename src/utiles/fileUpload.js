import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

 const uploadOnCloudinary = async (filePath) => {
  try { 
    if(!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto", // Automatically detect the resource type (image, video, etc.)
    });
   // console.log("file is uploaded on cloudinary",response.url);
    //return response;
    fs.unlinkSync(filePath); // Delete the file after upload
    return response
  } catch (error) { fs.unlinkSync(filePath); // Delete the file if upload fails
    console.error("Error uploading file to Cloudinary:", error);
   return null;
  }
};

const deleteFromCloudinary = async (url, resourceType = "image") => {
  if (!url) {
    return null;
  }

  const resourcePublicId = url.split("/").pop().split(".")[0];

  const response = await cloudinary.uploader.destroy(resourcePublicId, {
    resource_type: resourceType,
  });

  console.log("42, deleteFromCloudinaryResponse", response);
};

export { uploadOnCloudinary, deleteFromCloudinary };
