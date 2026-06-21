from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.auth import sincronizar_usuario_sesion
from app.database import SessionLocal
from app.services import notifications_service


class NotificationsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.notifications = []
        request.state.notification_count = 0

        path = request.url.path
        if path.startswith("/static") or path in (
            "/login",
            "/recuperar-contrasena",
            "/verificar-codigo",
            "/restablecer-contrasena",
            "/bandeja-correo",
        ):
            return await call_next(request)

        user = request.session.get("user")
        if user:
            db = SessionLocal()
            try:
                sincronizar_usuario_sesion(request, db)
                user = request.session.get("user")
                if user:
                    notificaciones = notifications_service.obtener_notificaciones(db)
                    request.state.notifications = notificaciones
                    request.state.notification_count = len(notificaciones)
            finally:
                db.close()

        return await call_next(request)
