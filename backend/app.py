from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# 配置静态文件目录
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['STATIC_FOLDER'] = 'static'

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 导入路由
from routes import auth, space, file

# 注册路由
app.register_blueprint(auth.bp, url_prefix='/api/auth')
app.register_blueprint(space.bp, url_prefix='/api/space')
app.register_blueprint(file.bp, url_prefix='/api/file')

# 静态文件服务
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.config['STATIC_FOLDER'], path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
