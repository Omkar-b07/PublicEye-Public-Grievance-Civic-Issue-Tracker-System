from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, issues, admin

app = FastAPI(title="Public-Eye API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(issues.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Public-Eye API"}
