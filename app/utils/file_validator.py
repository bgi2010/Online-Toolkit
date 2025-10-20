"""
文件验证工具模块
"""
from typing import List

# 支持的音频格式
SUPPORTED_AUDIO_FORMATS = ['.mp3', '.wav', '.flac', '.m4a', '.aac']

# 文件大小限制（字节）
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """
    验证文件扩展名
    
    Args:
        filename: 文件名
        allowed_extensions: 允许的扩展名列表（如 ['.mp3', '.wav']）
    
    Returns:
        bool: 是否符合要求
    """
    return any(filename.lower().endswith(ext) for ext in allowed_extensions)

def validate_file_size(file_size: int, max_size: int = MAX_FILE_SIZE) -> bool:
    """
    验证文件大小
    
    Args:
        file_size: 文件大小（字节）
        max_size: 最大允许大小（字节）
    
    Returns:
        bool: 是否在限制范围内
    """
    return 0 < file_size <= max_size

def get_safe_filename(filename: str) -> str:
    """
    获取安全的文件名（移除特殊字符）
    
    Args:
        filename: 原始文件名
    
    Returns:
        str: 安全的文件名
    """
    import re
    # 只保留字母、数字、下划线、连字符和点
    safe_name = re.sub(r'[^\w\-.]', '_', filename)
    return safe_name