import uuid
from supabase import create_client, Client
from app.config import settings
from fastapi import UploadFile

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def upload_image_to_supabase(file: UploadFile) -> str:
    """Uploads an image to Supabase Storage and returns the public URL."""
    try:
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Read file content
        contents = await file.read()
        
        # Upload
        res = supabase.storage.from_("issue-images").upload(file_name, contents)
        
        # Get public URL
        public_url = supabase.storage.from_("issue-images").get_public_url(file_name)
        
        return public_url
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise e
