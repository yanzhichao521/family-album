from flask import Blueprint, request, jsonify, send_from_directory
from datetime import datetime, timedelta
import os
import shutil

from model.database import get_db
from model.models import File, Space, SpaceMember, User, FileDownload
from schema.schemas import FileResponse
from routes.auth import get_current_user

bp = Blueprint('file', __name__)

# 允许的文件类型
ALLOWED_EXTENSIONS = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'],
    'video': ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv']
}

# 检查文件类型是否允许
def allowed_file(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return True
    return False

# 上传文件
@bp.route('/upload', methods=['POST'])
def upload_file():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    space_id = request.form.get('space_id')
    if not space_id:
        return jsonify({"error": "缺少空间ID"}), 400
    
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "缺少文件"}), 400
    
    # 检查用户是否在空间中
    db = next(get_db())
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        return jsonify({"error": "您不是该空间的成员"}), 403
    
    # 检查文件类型
    if not allowed_file(file.filename):
        return jsonify({"error": "只允许上传照片和视频文件"}), 400
    
    # 创建上传目录
    upload_dir = f"static/uploads/{space_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # 生成文件路径
    file_path = os.path.join(upload_dir, file.filename)
    
    # 保存文件
    file.save(file_path)
    
    # 计算文件大小
    file_size = os.path.getsize(file_path)
    
    # 确定文件类型
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    file_type = 'image' if ext in ALLOWED_EXTENSIONS['image'] else 'video'
    
    # 计算过期时间（30天）
    expiry_time = datetime.utcnow() + timedelta(days=30)
    
    # 创建文件记录
    db_file = File(
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
    
    file_response = FileResponse(
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
    return jsonify(file_response.dict())

# 获取空间文件列表
@bp.route('/list/<space_id>', methods=['GET'])
def get_files(space_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    # 检查用户是否在空间中
    db = next(get_db())
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        return jsonify({"error": "您不是该空间的成员"}), 403
    
    # 获取空间中的所有文件
    files = db.query(File).filter(
        File.space_id == space_id,
        File.is_deleted == False
    ).order_by(File.upload_time.desc()).all()
    
    # 转换为响应格式
    file_responses = []
    for file in files:
        # 计算下载次数
        download_count = db.query(FileDownload).filter(FileDownload.file_id == file.id).count()
        
        # 检查当前用户是否已下载
        is_downloaded = db.query(FileDownload).filter(
            FileDownload.file_id == file.id,
            FileDownload.user_id == current_user.id
        ).first() is not None
        
        # 获取上传者昵称
        uploader = db.query(User).filter(User.id == file.uploader_id).first()
        uploader_nickname = uploader.nickname if uploader else "未知用户"
        
        file_response = FileResponse(
            id=file.id,
            space_id=file.space_id,
            uploader_id=file.uploader_id,
            uploader_nickname=uploader_nickname,
            file_name=file.file_name,
            file_size=file.file_size,
            file_type=file.file_type,
            file_path=file.file_path,
            upload_time=file.upload_time,
            expiry_time=file.expiry_time,
            is_deleted=file.is_deleted,
            download_count=download_count,
            is_downloaded=is_downloaded
        )
        file_responses.append(file_response.dict())
    
    return jsonify(file_responses)

# 下载文件
@bp.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    db = next(get_db())
    # 获取文件信息
    file = db.query(File).filter(File.id == file_id).first()
    if not file or file.is_deleted:
        return jsonify({"error": "文件不存在或已删除"}), 404
    
    # 检查用户是否在空间中
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == file.space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        return jsonify({"error": "您不是该空间的成员"}), 403
    
    # 记录下载
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
    
    # 检查是否所有成员都已下载
    space_members = db.query(SpaceMember).filter(SpaceMember.space_id == file.space_id).count()
    file_downloads = db.query(FileDownload).filter(FileDownload.file_id == file_id).count()
    
    # 如果所有成员都已下载，标记文件为已删除
    if space_members > 0 and file_downloads >= space_members:
        file.is_deleted = True
        # 删除物理文件
        file_path = os.path.join("static", file.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.commit()
    
    # 检查文件是否过期
    if datetime.utcnow() > file.expiry_time:
        file.is_deleted = True
        # 删除物理文件
        file_path = os.path.join("static", file.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.commit()
        return jsonify({"error": "文件已过期"}), 410
    
    # 返回文件路径
    return jsonify({"file_path": f"/static/{file.file_path}"})
