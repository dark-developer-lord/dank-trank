from fastapi import FastAPI

app = FastAPI(title="My API", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}

@app.get("/health")
async def health():
    return {"status": "ok"}
