import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

SCRIPT_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = SCRIPT_DIR.parent / "temp"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
}


async def upload_file(file: UploadFile):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}",
        )

    original_name = file.filename or "uploaded-file"
    file_extension = Path(original_name).suffix
    saved_filename = f"{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / saved_filename

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {error}",
        ) from error
    finally:
        await file.close()

    return {
        "name": original_name,
        "filename": saved_filename,
        "file_path": str(file_path),
        "content_type": file.content_type,
    }
