# 在线工具集平台 - 后端服务

基于 FastAPI 的音频转换与文件处理工具集后端 API。

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 运行开发服务器
```bash
uvicorn app.main:app --reload
```

### 3. 访问 API 文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- 健康检查: http://localhost:8000/api/health

## 项目结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI 应用入口
│   ├── routers/          # API 路由模块
│   │   └── __init__.py
│   └── utils/            # 工具函数
│       └── __init__.py
├── requirements.txt      # Python 依赖
└── README.md
```

## 技术栈
- FastAPI 0.104.1
- Python 3.11+
- ffmpeg-python
- uvicorn
```

---

## ② 文件目录结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── routers/
│   │   └── __init__.py
│   └── utils/
│       └── __init__.py
├── requirements.txt
├── .gitignore
└── README.md