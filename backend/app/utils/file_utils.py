import os
import tempfile
from contextlib import contextmanager


@contextmanager
def secure_temp_file(suffix: str = ".jpg"):
    """
    Context manager for secure temporary file handling.

    Creates a temporary file that is guaranteed to be deleted when the
    context exits, even if an exception occurs.

    Args:
        suffix: File extension for the temporary file.

    Yields:
        Tuple of (file_handle, file_path).

    Example:
        with secure_temp_file(suffix='.jpg') as (tmp, path):
            cv2.imwrite(path, image)
            # ... process file ...
        # File is automatically deleted here
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp_path = tmp.name
        yield tmp, tmp_path
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def create_secure_temp_path(suffix: str = ".jpg") -> str:
    """
    Create a temporary file path that must be manually cleaned up.

    Use this when you need to create a temp file outside a context manager
    but still want guaranteed cleanup.

    Args:
        suffix: File extension for the temporary file.

    Returns:
        Path to the temporary file.
    """
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        return tmp.name


def cleanup_temp_file(path: str) -> None:
    """
    Safely remove a temporary file if it exists.

    Args:
        path: Path to the temporary file to remove.
    """
    if path and os.path.exists(path):
        os.unlink(path)
