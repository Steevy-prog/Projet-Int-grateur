from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wraps DRF errors into a consistent shape:
    { "error": "...", "detail": "..." }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_detail = response.data

        # Flatten single-key detail responses
        if isinstance(error_detail, dict) and 'detail' in error_detail:
            message = str(error_detail['detail'])
        elif isinstance(error_detail, list):
            message = ' '.join(str(e) for e in error_detail)
        else:
            message = str(error_detail)

        response.data = {
            'error': response.status_code,
            'detail': message,
        }

    return response
