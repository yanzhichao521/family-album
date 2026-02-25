from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import shutil

from model.database import get_db
from model.models import File as FileModel, Space, SpaceMember, User, FileDownload
from schema.schemas import FileResponse, MessageResponse
from api.auth import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'],
    'video': ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv']
}

def allowed_file(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return True
    return False

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    space_id: int = Form(...),
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该空间的成员"
        )
    
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只允许上传照片和视频文件"
        )
    
    upload_dir = f"static/uploads/{space_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    file_type = 'image' if ext in ALLOWED_EXTENSIONS['image'] else 'video'
    
    expiry_time = datetime.utcnow() + timedelta(days=30)
    
    db_file = FileModel(
        space_id=space_id,
        uploader_id=current_user.id,
        file_name=file.filename,
        file_path=file_path.replace('static/', ''),
        file_size=file_size,
        file_type=file_type,
        expiry_time=expiry_time
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return FileResponse(
        id=db_file.id,
        space_id=db_file.space_id,
        uploader_id=db_file.uploader_id,
        uploader_nickname=current_user.nickname,
        file_name=db_file.file_name,
        file_size=db_file.file_size,
        file_type=db_file.file_type,
        file_path=db_file.file_path,
        upload_time=db_file.upload_time,
        expiry_time=db_file.expiry_time,
        is_deleted=db_file.is_deleted,
        download_count=0,
        is_downloaded=False
    )

@router.get("/list/{space_id}", response_model=list[FileResponse])
async def get_files(
    space_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该空间的成员"
        )
    
    files = db.query(FileModel).filter(
        FileModel.space_id == space_id,
        FileModel.is_deleted == False
    ).order_by(FileModel.upload_time.desc()).all()
    
    file_responses = []
    for f in files:
        download_count = db.query(FileDownload).filter(FileDownload.file_id == f.id).count()
        
        is_downloaded = db.query(FileDownload).filter(
            FileDownload.file_id == f.id,
            FileDownload.user_id == current_user.id
        ).first() is not None
        
        uploader = db.query(User).filter(User.id == f.uploader_id).first()
        uploader_nickname = uploader.nickname if uploader else "未知用户"
        
        file_responses.append(FileResponse(
            id=f.id,
            space_id=f.space_id,
            uploader_id=f.uploader_id,
            uploader_nickname=uploader_nickname,
            file_name=f.file_name,
            file_size=f.file_size,
            file_type=f.file_type,
            file_path=f.file_path,
            upload_time=f.upload_time,
            expiry_time=f.expiry_time,
            is_deleted=f.is_deleted,
            download_count=download_count,
            is_downloaded=is_downloaded
        ))
    
    return file_responses

@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not f or f.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在或已删除"
        )
    
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == f.space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该空间的成员"
        )
    
    existing_download = db.query(FileDownload).filter(
        FileDownload.file_id == file_id,
        FileDownload.user_id == current_user.id
    ).first()
    if not existing_download:
        download = FileDownload(
            file_id=file_id,
            user_id=current_user.id
        )
        db.add(download)
        db.commit()
    
    space_members = db.query(SpaceMember).filter(SpaceMember.space_id == f.space_id).count()
    file_downloads = db.query(FileDownload).filter(FileDownload.file_id == file_id).count()
    
    if space_members > 0 and file_downloads >= space_members:
        f.is_deleted = True
        file_path = os.path.join("static", f.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.commit()
    
    if datetime.utcnow() > f.expiry_time:
        f.is_deleted = True
        file_path = os.path.join("static", f.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="文件已过期"
        )
    
    return {"file_path": f"/static/{f.file_path}"}
