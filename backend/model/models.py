from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True, nullable=False)
    nickname = Column(String(100), nullable=False)
    avatar = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    spaces = relationship("SpaceMember", back_populates="user")
    files = relationship("File", back_populates="uploader")
    downloads = relationship("FileDownload", back_populates="user")

class Space(Base):
    __tablename__ = "spaces"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    invitation_code = Column(String(20), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    members = relationship("SpaceMember", back_populates="space")
    files = relationship("File", back_populates="space")

class SpaceMember(Base):
    __tablename__ = "space_members"
    
    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    space = relationship("Space", back_populates="members")
    user = relationship("User", back_populates="spaces")

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    space_id = Column(Integer, ForeignKey("spaces.id"), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # 文件大小（字节）
    file_type = Column(String(50), nullable=False)  # 文件类型
    upload_time = Column(DateTime, default=datetime.utcnow)
    expiry_time = Column(DateTime, nullable=False)  # 过期时间（30天）
    is_deleted = Column(Boolean, default=False)
    
    # 关系
    space = relationship("Space", back_populates="files")
    uploader = relationship("User", back_populates="files")
    downloads = relationship("FileDownload", back_populates="file")

class FileDownload(Base):
    __tablename__ = "file_downloads"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    download_time = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    file = relationship("File", back_populates="downloads")
    user = relationship("User", back_populates="downloads")
