from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import random

from model.database import get_db
from model.models import User
from schema.schemas import UserCreate, UserResponse, UserUpdate, LoginResponse, default_avatars

bp = Blueprint('auth', __name__)

# JWT配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30天

# 生成访问令牌
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 验证令牌
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None

# 获取当前用户
def get_current_user():
    token = request.headers.get("Authorization")
    if not token:
        return None
    token = token.split(" ")[1] if " " in token else token
    user_id = verify_token(token)
    if not user_id:
        return None
    db = next(get_db())
    user = db.query(User).filter(User.id == user_id).first()
    return user

# 登录/注册
@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'device_id' not in data or 'nickname' not in data:
        return jsonify({"error": "缺少必要参数"}), 400
    
    device_id = data['device_id']
    nickname = data['nickname']
    
    db = next(get_db())
    # 查找用户
    user = db.query(User).filter(User.device_id == device_id).first()
    
    # 如果用户不存在，创建新用户
    if not user:
        # 随机分配一个默认头像
        avatar = random.choice(default_avatars)
        user = User(
            device_id=device_id,
            nickname=nickname,
            avatar=avatar
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    user_response = UserResponse.from_orm(user)
    return jsonify({
        "user": user_response.dict(),
        "token": access_token
    })

# 获取当前用户信息
@bp.route('/me', methods=['GET'])
def get_me():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    user_response = UserResponse.from_orm(current_user)
    return jsonify(user_response.dict())

# 更新用户信息
@bp.route('/me', methods=['PUT'])
def update_me():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "未授权"}), 401
    
    data = request.json
    if not data:
        return jsonify({"error": "缺少更新数据"}), 400
    
    db = next(get_db())
    if 'nickname' in data:
        current_user.nickname = data['nickname']
    if 'avatar' in data:
        current_user.avatar = data['avatar']
    db.commit()
    db.refresh(current_user)
    
    user_response = UserResponse.from_orm(current_user)
    return jsonify(user_response.dict())
