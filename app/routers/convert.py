from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import ffmpeg
import os
import uuid
import logging
from pathlib import Path
import aiofiles
import zipfile
from typing import List
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/convert",
    tags=["音频转换"]
)

# 跨平台临时文件存储目录
def get_temp_dir() -> Path:
    """
    获取跨平台的临时目录路径
    """
    import tempfile
    import sys
    
    if sys.platform == "win32":
        # Windows 环境使用系统临时目录
        base_temp = Path(tempfile.gettempdir())
    else:
        # Linux/Mac 使用 /tmp
        base_temp = Path("/tmp")
    
    temp_dir = base_temp / "audio_converter"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir

TEMP_DIR = get_temp_dir()
logger.info(f"临时文件目录: {TEMP_DIR}")

def cleanup_file(filepath: str):
    """
    后台任务：清理临时文件
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.info(f"已清理临时文件: {filepath}")
    except Exception as e:
        logger.error(f"清理文件失败 {filepath}: {str(e)}")

def validate_mp3_file(filename: str) -> bool:
    """
    验证文件是否为 mp3 格式
    """
    return filename.lower().endswith('.mp3')

async def convert_mp3_to_wav(input_path: str, output_path: str) -> bool:
    """
    使用 ffmpeg 将 mp3 转换为 wav
    
    Args:
        input_path: 输入 mp3 文件路径
        output_path: 输出 wav 文件路径
    
    Returns:
        bool: 转换是否成功
    """
    try:
        # 使用 ffmpeg 进行转换
        # 参数说明：
        # - acodec pcm_s16le: 使用 PCM 16-bit 编码
        # - ar 44100: 采样率 44.1kHz
        # - ac 2: 双声道
        stream = ffmpeg.input(input_path)
        stream = ffmpeg.output(
            stream,
            output_path,
            acodec='pcm_s16le',
            ar='44100',
            ac=2
        )
        ffmpeg.run(stream, overwrite_output=True, capture_stdout=True, capture_stderr=True)
        
        logger.info(f"转换成功: {input_path} -> {output_path}")
        return True
    
    except ffmpeg.Error as e:
        logger.error(f"ffmpeg 转换失败: {e.stderr.decode() if e.stderr else str(e)}")
        return False
    except Exception as e:
        logger.error(f"转换过程出错: {str(e)}")
        return False

def create_zip_archive(files: List[Path], zip_path: Path, original_names: List[str]) -> bool:
    """
    创建 ZIP 压缩包
    
    Args:
        files: 临时文件路径列表
        zip_path: ZIP 文件保存路径
        original_names: 原始文件名列表（不含扩展名）
    
    Returns:
        bool: 是否成功
    """
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file, original_name in zip(files, original_names):
                if file.exists():
                    # 使用原始文件名，添加 .wav 扩展名
                    clean_name = f"{original_name}.wav"
                    zipf.write(file, clean_name)
        logger.info(f"已创建 ZIP 文件: {zip_path}，包含 {len(files)} 个文件")
        return True
    except Exception as e:
        logger.error(f"创建 ZIP 失败: {str(e)}")
        return False

@router.post("/mp3-to-wav")
async def mp3_to_wav(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    将上传的 mp3 文件转换为 wav 格式
    支持单文件和多文件批量转换
    
    Args:
        files: 上传的 mp3 文件列表
    
    Returns:
        JSONResponse: 包含转换状态和下载链接
    """
    
    # 1. 验证至少有一个文件
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail="请至少上传一个文件"
        )
    
    # 2. 验证所有文件类型
    invalid_files = []
    for file in files:
        if not validate_mp3_file(file.filename):
            invalid_files.append(file.filename)
    
    if invalid_files:
        raise HTTPException(
            status_code=400,
            detail=f"以下文件不是 mp3 格式: {', '.join(invalid_files)}"
        )
    
    # 3. 生成唯一批次 ID
    batch_id = str(uuid.uuid4())
    
    # 存储输入和输出文件路径
    input_files = []
    output_files = []
    original_names = []
    
    try:
        # 4. 保存所有上传的文件
        for idx, file in enumerate(files):
            input_filename = f"{batch_id}_input_{idx}.mp3"
            input_path = TEMP_DIR / input_filename
            
            async with aiofiles.open(input_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            input_files.append(input_path)
            logger.info(f"文件已保存: {input_path} ({len(content)} bytes)")
            
            # 保存原始文件名（不含扩展名）
            original_names.append(Path(file.filename).stem)
        
        # 5. 并发转换所有文件
        conversion_tasks = []
        for idx, (file, input_path) in enumerate(zip(files, input_files)):
            original_name = Path(file.filename).stem
            # 临时文件使用 UUID，但最终输出不包含
            unique_output_filename = f"{batch_id}_{original_name}.wav"
            output_path = TEMP_DIR / unique_output_filename
            output_files.append(output_path)
            
            # 创建转换任务
            task = convert_mp3_to_wav(str(input_path), str(output_path))
            conversion_tasks.append(task)
        
        # 并发执行所有转换
        results = await asyncio.gather(*conversion_tasks)
        
        # 6. 检查转换结果
        if not all(results):
            # 清理所有文件
            for f in input_files + output_files:
                background_tasks.add_task(cleanup_file, str(f))
            raise HTTPException(
                status_code=500,
                detail="部分文件转换失败，请检查文件是否损坏"
            )
        
        # 7. 验证所有输出文件存在
        missing_files = [f for f in output_files if not f.exists()]
        if missing_files:
            for f in input_files + output_files:
                background_tasks.add_task(cleanup_file, str(f))
            raise HTTPException(
                status_code=500,
                detail="转换失败：部分输出文件未生成"
            )
        
        # 8. 清理输入文件
        for input_path in input_files:
            background_tasks.add_task(cleanup_file, str(input_path))
        
        # 9. 根据文件数量返回不同响应
        if len(output_files) == 1:
            # 单文件：直接返回下载链接
            output_filename = output_files[0].name
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "downloadUrl": f"/api/download/{output_filename}",
                    "message": "转换成功",
                    "filename": output_filename,
                    "fileCount": 1
                }
            )
        else:
            # 多文件：创建 ZIP 压缩包
            zip_filename = f"{batch_id}_converted.zip"
            zip_path = TEMP_DIR / zip_filename
            
            if not create_zip_archive(output_files, zip_path, original_names):
                for f in output_files:
                    background_tasks.add_task(cleanup_file, str(f))
                raise HTTPException(
                    status_code=500,
                    detail="创建压缩包失败"
                )
            
            # 清理单个 WAV 文件（保留 ZIP）
            for output_path in output_files:
                background_tasks.add_task(cleanup_file, str(output_path))
            
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "downloadUrl": f"/api/download/{zip_filename}",
                    "message": f"成功转换 {len(output_files)} 个文件",
                    "filename": zip_filename,
                    "fileCount": len(output_files)
                }
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"处理请求时出错: {str(e)}")
        # 清理所有可能存在的临时文件
        for f in input_files + output_files:
            background_tasks.add_task(cleanup_file, str(f))
        
        raise HTTPException(
            status_code=500,
            detail=f"服务器内部错误: {str(e)}"
        )