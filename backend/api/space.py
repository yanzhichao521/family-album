from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
import string

from model.database import get_db
from model.models import Space, SpaceMember, User
from schema.schemas import SpaceCreate, SpaceResponse, SpaceMemberResponse
from api.auth import get_current_user

router = APIRouter()

# 生成邀请码
def generate_invitation_code(length: int = 8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# 创建空间
@router.post("/create", response_model=SpaceResponse)
async def create_space(space_data: SpaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 生成唯一的邀请码
    invitation_code = generate_invitation_code()
    while db.query(Space).filter(Space.invitation_code == invitation_code).first():
        invitation_code = generate_invitation_code()
    
    # 创建空间
    space = Space(
        name=space_data.name,
        invitation_code=invitation_code
    )
    db.add(space)
    db.commit()
    db.refresh(space)
    
    # 添加创建者为管理员
    space_member = SpaceMember(
        space_id=space.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(space_member)
    db.commit()
    
    return SpaceResponse(
        id=space.id,
        name=space.name,
        invitation_code=space.invitation_code,
        created_at=space.created_at,
        member_count=1
    )

# 获取用户的空间列表
@router.get("/list", response_model=list[SpaceResponse])
async def get_spaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 获取用户加入的所有空间
    space_members = db.query(SpaceMember).filter(SpaceMember.user_id == current_user.id).all()
    spaces = []
    
    for member in space_members:
        space = member.space
        # 计算空间成员数量
        member_count = db.query(SpaceMember).filter(SpaceMember.space_id == space.id).count()
        spaces.append(SpaceResponse(
            id=space.id,
            name=space.name,
            invitation_code=space.invitation_code,
            created_at=space.created_at,
            member_count=member_count
        ))
    
    return spaces

# 加入空间
@router.post("/join/{invitation_code}", response_model=SpaceResponse)
async def join_space(invitation_code: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 查找空间
    space = db.query(Space).filter(Space.invitation_code == invitation_code).first()
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="空间不存在或邀请码无效"
        )
    
    # 检查用户是否已经在空间中
    existing_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space.id,
        SpaceMember.user_id == current_user.id
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经在该空间中"
        )
    
    # 检查空间成员数量是否超过限制（10人）
    member_count = db.query(SpaceMember).filter(SpaceMember.space_id == space.id).count()
    if member_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="空间成员数量已达上限（10人）"
        )
    
    # 添加用户到空间
    space_member = SpaceMember(
        space_id=space.id,
        user_id=current_user.id,
        is_admin=False
    )
    db.add(space_member)
    db.commit()
    
    return SpaceResponse(
        id=space.id,
        name=space.name,
        invitation_code=space.invitation_code,
        created_at=space.created_at,
        member_count=member_count + 1
    )

# 获取空间成员列表
@router.get("/{space_id}/members", response_model=list[SpaceMemberResponse])
async def get_space_members(space_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 检查用户是否在空间中
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该空间的成员"
        )
    
    # 获取所有成员
    members = db.query(SpaceMember).filter(SpaceMember.space_id == space_id).all()
    member_responses = []
    
    for member in members:
        user = member.user
        member_responses.append(SpaceMemberResponse(
            id=member.id,
            user_id=member.user_id,
            nickname=user.nickname,
            avatar=user.avatar,
            is_admin=member.is_admin,
            joined_at=member.joined_at
        ))
    
    return member_responses
