with open('backend/app/routers/auth.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find end of def me()
idx = content.find('# POST /api/auth/verify-email-otp')
if idx != -1:
    content = content[:idx].strip() + '\n'

with open('backend/app/routers/auth.py', 'w', encoding='utf-8') as f:
    f.write(content)
