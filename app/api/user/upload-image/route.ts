import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { authOptions } from "../../../../lib/auth/auth-options";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "profiles");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const userEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, "_");
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${userEmail}_${timestamp}.webp`; // Always convert to webp

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with sharp
    const processedImage = await sharp(buffer)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Write file to disk
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, processedImage);

    // Return the public URL
    const imageUrl = `/uploads/profiles/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");

    if (!imageUrl || !imageUrl.startsWith("/uploads/profiles/")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    // Extract filename from URL
    const filename = imageUrl.split("/").pop();
    if (!filename) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Delete file from disk
    const filePath = join(
      process.cwd(),
      "public",
      "uploads",
      "profiles",
      filename
    );

    try {
      const { unlink } = await import("fs/promises");
      await unlink(filePath);
    } catch (fileError) {
      // File might not exist, which is okay
      console.warn("Could not delete file:", filePath, fileError);
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
