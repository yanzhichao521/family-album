from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

default_avatars = [
    "https://api.dicebear.com/7.x/notionists/svg?seed=Mom&backgroundColor=ffe4e1",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Dad&backgroundColor=d0e8ff",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Grandma&backgroundColor=fff3e0",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Grandpa&backgroundColor=f3e5f5",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Child1&backgroundColor=e8f5e9",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Child2&backgroundColor=fff8e1",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Aunt&backgroundColor=e3f2fd",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Uncle&backgroundColor=fce4ec",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Cousin&backgroundColor=f1f8e9",
    "https://api.dicebear.com/7.x/notionists/svg?seed=Friend&backgroundColor=ede7f6"
]

class UserBase(BaseModel):
    device_id: str
    nickname: str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar: Optional[str] = None

class UserResponse(UserBase):
    id: int
    avatar: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    user: UserResponse
    token: str

class SpaceBase(BaseModel):
    name: str

class SpaceCreate(SpaceBase):
    pass

class SpaceResponse(SpaceBase):
    id: int
    invitation_code: str
    created_at: datetime
    member_count: int
    
    model_config = ConfigDict(from_attributes=True)

class SpaceMemberResponse(BaseModel):
    id: int
    user_id: int
    nickname: str
    avatar: Optional[str] = None
    is_admin: bool
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class FileBase(BaseModel):
    file_name: str
    file_size: int
    file_type: str

class FileUpload(BaseModel):
    space_id: int

class FileResponse(FileBase):
    id: int
    space_id: int
    uploader_id: int
    uploader_nickname: str
    file_path: str
    upload_time: datetime
    expiry_time: datetime
    is_deleted: bool
    download_count: int
    is_downloaded: bool = False
    
    model_config = ConfigDict(from_attributes=True)

class FileDownloadResponse(BaseModel):
    id: int
    file_id: int
    user_id: int
    download_time: datetime
    
    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str
