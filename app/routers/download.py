from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import os
import logging
from pathlib import Path
from urllib.parse import quote
from routers.convert import TEMP_DIR, cleanup_file

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/download",
    tags=["文件下载"]
)

# MIME 类型映射
MIME_TYPES = {
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf',
}

def get_mime_type(filename: str) -> str:
    """
    根据文件扩展名获取 MIME 类型
    
    Args:
        filename: 文件名
    
    Returns:
        str: MIME 类型
    """
    ext = Path(filename).suffix.lower()
    return MIME_TYPES.get(ext, 'application/octet-stream')

@router.get("/{filename}")
async def download_file(
    filename: str,
    background_tasks: BackgroundTasks
):
    """
    下载转换后的文件
    
    Args:
        filename: 文件名（从转换接口返回的 filename 字段）
    
    Returns:
        FileResponse: 文件流响应
    """
    
    # 1. 构建文件完整路径
    file_path = TEMP_DIR / filename
    
    # 2. 验证文件是否存在
    if not file_path.exists():
        logger.error(f"文件不存在: {file_path}")
        raise HTTPException(
            status_code=404,
            detail="文件不存在或已被删除"
        )
    
    # 3. 验证文件是否在允许的临时目录内（安全检查）
    try:
        file_path.resolve().relative_to(TEMP_DIR.resolve())
    except ValueError:
        logger.error(f"非法文件路径访问: {file_path}")
        raise HTTPException(
            status_code=403,
            detail="访问被拒绝"
        )
    
    # 4. 获取文件 MIME 类型
    media_type = get_mime_type(filename)
    
    # 5. 获取原始文件名（去除 UUID 前缀）
    # 格式: {uuid}_{original_name}.wav
    parts = filename.split('_', 1)
    if len(parts) > 1:
        download_filename = parts[1]  # 使用原始文件名
    else:
        download_filename = filename
    
    # 6. 使用 RFC 5987 编码处理中文文件名
    encoded_filename = quote(download_filename)
    
    logger.info(f"开始下载文件: {filename} -> {download_filename} ({media_type})")
    
    # 7. 添加后台任务：下载完成后清理文件
    background_tasks.add_task(cleanup_file, str(file_path))
    
    # 8. 返回文件响应（使用 RFC 5987 编码）
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=download_filename,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )