"""
Logging configuration with environment-based formatters.

Development: Human-readable logs for terminal debugging
Production: JSON-structured logs for parsing and analysis
"""

import logging
import json
import sys
from contextvars import ContextVar
from typing import Any

from app.core.config import get_settings

# Context variable for request ID (set by middleware)
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class HumanReadableFormatter(logging.Formatter):
    """Development formatter: Pretty logs for humans."""
    
    # Color codes for terminal output
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        request_id = request_id_var.get()
        request_id_str = f" [req:{request_id[:8]}]" if request_id else ""
        
        # Add color in development
        color = self.COLORS.get(record.levelname, '')
        reset = self.RESET if color else ''
        
        base = (
            f"{self.formatTime(record, '%Y-%m-%d %H:%M:%S')} "
            f"{color}{record.levelname:8s}{reset}"
            f"{request_id_str} "
            f"{record.name}: {record.getMessage()}"
        )
        
        if record.exc_info:
            base += "\n" + self.formatException(record.exc_info)
        
        return base


class JSONFormatter(logging.Formatter):
    """Production formatter: Structured logs for parsing."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record, '%Y-%m-%dT%H:%M:%S'),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get() or None,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields from record (e.g., user_id, order_id)
        for key, value in record.__dict__.items():
            if key not in (
                "args", "exc_info", "exc_text", "msg", "levelname", "levelno",
                "pathname", "filename", "module", "lineno", "funcName", "created",
                "msecs", "relativeCreated", "thread", "threadName", "processName",
                "process", "message", "name", "stack_info", "taskName"
            ):
                log_data[key] = value
        
        return json.dumps(log_data)


def setup_logging() -> None:
    """
    Configure application logging based on environment.
    
    Development: Human-readable colored output
    Production: JSON-structured output for log aggregation
    """
    settings = get_settings()
    
    # Choose formatter based on environment
    if settings.ENVIRONMENT == "development":
        formatter = HumanReadableFormatter()
    else:
        formatter = JSONFormatter()
    
    # Configure handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers.clear()  # Remove any existing handlers
    root_logger.addHandler(handler)
    
    # Set log level from environment (default: INFO in prod, DEBUG in dev)
    log_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    root_logger.setLevel(log_level)
    
    # Reduce noise from third-party libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


def set_request_id(request_id: str) -> None:
    """Set request ID in context for logging."""
    request_id_var.set(request_id)


def get_request_id() -> str:
    """Get current request ID from context."""
    return request_id_var.get()
