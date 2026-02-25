from model.database import engine, Base
from model.models import User, Space, SpaceMember, File, FileDownload

# 创建所有表
Base.metadata.create_all(bind=engine)
print("数据库表创建成功！")
