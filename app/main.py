from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from routers import convert, download  # 添加 download 导入

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用实例
app = FastAPI(
    title="在线工具集平台 API",
    description="提供音频转换、文件处理等工具的 API 服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.2.245:3000",
        "https://*.vercel.app",  # ✅ 确保有这一行
        "https://*.railway.app",  # 添加这一行（可选）
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(convert.router)
app.include_router(download.router)  # 新增下载路由

# 健康检查接口
@app.get("/api/health")
async def health_check():
    """
    健康检查接口
    返回服务状态
    """
    return {
        "status": "ok",
        "message": "FastAPI 服务运行正常",
        "version": "1.0.0"
    }

# 根路径重定向到文档
@app.get("/")
async def root():
    """
    根路径欢迎信息
    """
    return {
        "message": "欢迎使用在线工具集平台 API",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
