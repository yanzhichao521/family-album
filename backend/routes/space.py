from flask import Blueprint, request, jsonify
import random
import string

from model.database import get_db
from model.models import Space, SpaceMember, User
from schema.schemas import SpaceCreate, SpaceResponse, SpaceMemberResponse
from routes.auth import get_current_user

bp = Blueprint('space', __name__)

# 生成邀请码
def generate_invitation_code(length: int = 8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

# 创建空间
@bp.route('/create', methods=['POST'])
def create_space():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"error": "缺少空间名称"}), 400
    
    name = data['name']
    db = next(get_db())
    
    # 生成唯一的邀请码
    invitation_code = generate_invitation_code()
    while db.query(Space).filter(Space.invitation_code == invitation_code).first():
        invitation_code = generate_invitation_code()
    
    # 创建空间
    space = Space(
        name=name,
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
    
    space_response = SpaceResponse(
        id=space.id,
        name=space.name,
        invitation_code=space.invitation_code,
        created_at=space.created_at,
        member_count=1
    )
    return jsonify(space_response.dict())

# 获取用户的空间列表
@bp.route('/list', methods=['GET'])
def get_spaces():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    db = next(get_db())
    # 获取用户加入的所有空间
    space_members = db.query(SpaceMember).filter(SpaceMember.user_id == current_user.id).all()
    spaces = []
    
    for member in space_members:
        space = member.space
        # 计算空间成员数量
        member_count = db.query(SpaceMember).filter(SpaceMember.space_id == space.id).count()
        space_response = SpaceResponse(
            id=space.id,
            name=space.name,
            invitation_code=space.invitation_code,
            created_at=space.created_at,
            member_count=member_count
        )
        spaces.append(space_response.dict())
    
    return jsonify(spaces)

# 加入空间
@bp.route('/join/<invitation_code>', methods=['POST'])
def join_space(invitation_code):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    db = next(get_db())
    # 查找空间
    space = db.query(Space).filter(Space.invitation_code == invitation_code).first()
    if not space:
        return jsonify({"error": "空间不存在或邀请码无效"}), 404
    
    # 检查用户是否已经在空间中
    existing_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space.id,
        SpaceMember.user_id == current_user.id
    ).first()
    if existing_member:
        return jsonify({"error": "您已经在该空间中"}), 400
    
    # 检查空间成员数量是否超过限制（10人）
    member_count = db.query(SpaceMember).filter(SpaceMember.space_id == space.id).count()
    if member_count >= 10:
        return jsonify({"error": "空间成员数量已达上限（10人）"}), 400
    
    # 添加用户到空间
    space_member = SpaceMember(
        space_id=space.id,
        user_id=current_user.id,
        is_admin=False
    )
    db.add(space_member)
    db.commit()
    
    space_response = SpaceResponse(
        id=space.id,
        name=space.name,
        invitation_code=space.invitation_code,
        created_at=space.created_at,
        member_count=member_count + 1
    )
    return jsonify(space_response.dict())

# 获取空间成员列表
@bp.route('/<space_id>/members', methods=['GET'])
def get_space_members(space_id):
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    db = next(get_db())
    # 检查用户是否在空间中
    space_member = db.query(SpaceMember).filter(
        SpaceMember.space_id == space_id,
        SpaceMember.user_id == current_user.id
    ).first()
    if not space_member:
        return jsonify({"error": "您不是该空间的成员"}), 403
    
    # 获取所有成员
    members = db.query(SpaceMember).filter(SpaceMember.space_id == space_id).all()
    member_responses = []
    
    for member in members:
        user = member.user
        member_response = SpaceMemberResponse(
            id=member.id,
            user_id=member.user_id,
            nickname=user.nickname,
            avatar=user.avatar,
            is_admin=member.is_admin,
            joined_at=member.joined_at
        )
        member_responses.append(member_response.dict())
    
    return jsonify(member_responses)
