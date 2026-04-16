import uuid
import os
import aiofiles
from fastapi import UploadFile
from app.config import settings

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}

async def upload_image_locally(file: UploadFile) -> str:
    """Saves an uploaded image to the local filesystem and returns the public URL path."""
    try:
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"File type .{file_ext} is not allowed. Use: {ALLOWED_EXTENSIONS}")

        # Ensure upload directory exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, file_name)

        # Write file asynchronously
        contents = await file.read()
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(contents)

        # Return the URL path that FastAPI StaticFiles will serve
        return f"/static/uploads/{file_name}"

    except Exception as e:
        print(f"Error uploading image locally: {e}")
        raise e
