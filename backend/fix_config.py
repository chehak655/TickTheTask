import re

with open('app/core/config.py', 'r') as f:
    content = f.read()

content = re.sub(
    r'f"mysql\+pymysql://\{self\.DB_USER\}\{password_part\}@\{self\.DB_HOST\}:\{self\.DB_PORT\}/"\s*\n\s*f"\{self\.DB_NAME\}\?charset=utf8mb4"',
    'f"postgresql+psycopg2://{self.DB_USER}{password_part}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"',
    content
)

with open('app/core/config.py', 'w') as f:
    f.write(content)
