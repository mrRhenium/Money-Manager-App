/**
 * Uploads a file to Cloudinary directly from the frontend using an unsigned upload preset.
 * @param file The File object to upload
 * @param folder Optional folder path in Cloudinary (e.g., "money-manager/receipts")
 * @returns Promise resolving to the secure URL of the uploaded image
 */
export async function uploadImageToCloudinary(file: File, folder: string = "money-manager/general"): Promise<string> {
  if (!file) throw new Error("No file provided");

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing from environment variables");
  }

  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to upload image");
  }

  const data = await response.json();
  return data.secure_url;
}
