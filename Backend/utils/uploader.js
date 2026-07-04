import fs from "fs";
import path from "path";

const HOSPITAL_SOURCES = [
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1504813184591-015556c5c47d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1538108176839-a1d371fa7a3c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1488751045188-3c55bbf9a3fa?auto=format&fit=crop&w=600&q=80"
];

const MALE_DOCTORS = [
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1605684954278-9f17a2773d64?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1582750433449-649352e3ff4a?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80"
];

const FEMALE_DOCTORS = [
  "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1623854767648-e7bb8c5a451e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1651008011649-43a44f77c3e5?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1623854767648-e7bb8c5a451e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1651008011649-43a44f77c3e5?auto=format&fit=crop&w=300&q=80"
];

async function uploadToCloudinary(url) {
  try {
    const formData = new FormData();
    formData.append("file", url);
    formData.append("upload_preset", "doctor_portal");

    const res = await fetch("https://api.cloudinary.com/v1_1/dnb4jcioy/image/upload", {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data.secure_url;
  } catch (e) {
    console.error(`Error uploading ${url}:`, e.message);
    return null;
  }
}

async function run() {
  console.log("Uploading hospitals to Cloudinary...");
  const hospitalUrls = [];
  for (const url of HOSPITAL_SOURCES) {
    const uploaded = await uploadToCloudinary(url);
    if (uploaded) hospitalUrls.push(uploaded);
  }

  console.log("Uploading male doctors to Cloudinary...");
  const maleUrls = [];
  for (const url of MALE_DOCTORS) {
    const uploaded = await uploadToCloudinary(url);
    if (uploaded) maleUrls.push(uploaded);
  }

  console.log("Uploading female doctors to Cloudinary...");
  const femaleUrls = [];
  for (const url of FEMALE_DOCTORS) {
    const uploaded = await uploadToCloudinary(url);
    if (uploaded) femaleUrls.push(uploaded);
  }

  const results = {
    hospitals: hospitalUrls,
    maleDoctors: maleUrls,
    femaleDoctors: femaleUrls
  };

  fs.writeFileSync(path.join("utils", "uploaded_assets.json"), JSON.stringify(results, null, 2));
  console.log("Seeding assets created successfully in Backend/utils/uploaded_assets.json!");
}

run();
