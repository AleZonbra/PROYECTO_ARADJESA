from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from app.auth import require_auth
from app.database import Base, SessionLocal, engine
from app.exceptions import ForbiddenError, NotAuthenticatedError
from app.middleware.notifications import NotificationsMiddleware
from app.routes import web
from app.seed import inicializar_datos

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(title="SISARAD", version="1.0.0")
app.add_middleware(NotificationsMiddleware)
app.add_middleware(SessionMiddleware, secret_key="sisarad-python-secret-key-2026")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.state.templates = templates


@app.exception_handler(ForbiddenError)
async def redirect_forbidden(_request: Request, _exc: ForbiddenError):
    return RedirectResponse("/inicio?error=No+tienes+permiso+para+acceder+a+este+módulo", status_code=303)


@app.exception_handler(NotAuthenticatedError)
async def redirect_login(_request: Request, _exc: NotAuthenticatedError):
    return RedirectResponse("/login", status_code=303)


protected = APIRouter(dependencies=[Depends(require_auth)])
protected.include_router(web.protected_router)
app.include_router(web.public_router)
app.include_router(protected)

@app.on_event("startup")
def startup():
    (BASE_DIR / "data").mkdir(exist_ok=True)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        inicializar_datos(db)
    finally:
        db.close()


@app.get("/")
def root():
    return RedirectResponse(url="/inicio", status_code=303)
