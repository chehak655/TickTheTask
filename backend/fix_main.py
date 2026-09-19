import re

with open('app/main.py', 'r') as f:
    content = f.read()

# Replace the entire block
new_block = """app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""

content = re.sub(r'app\.add_middleware\([^)]+\)', new_block, content, flags=re.DOTALL)

with open('app/main.py', 'w') as f:
    f.write(content)
