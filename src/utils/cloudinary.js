import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    });


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // console.log(response);
        //file has been uploaded successfully
        console.log("File has been uploaded successfully");
        response.url //public url after uploaded the file on cloudinary
        // fs.unlink(localFilePath)
        return response
    } catch (error) {
        //removing the locally saved temporary file as the upload operation got failed 
        fs.unlinkSync(localFilePath)
    }
}

export { uploadOnCloudinary }