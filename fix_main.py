import re

with open('backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove imports
content = re.sub(r'from app\.routers import email\n', '', content)
content = re.sub(r'from app\.services\.reminder_scheduler import reminder_scheduler_loop\n', '', content)

# Remove email includes
content = re.sub(r'# Email diagnostics.*?\napp\.include_router\(email\.router.*?\napp\.include_router\(email\.router.*?\n\n', '', content, flags=re.DOTALL)

# Remove lifespan body related to email/scheduler
lifespan_start = content.find('    # Email Delivery Mode diagnostics')
lifespan_end = content.find('    yield\n')
if lifespan_start != -1 and lifespan_end != -1:
    content = content[:lifespan_start] + content[lifespan_end:]

# Remove task cancellation in lifespan
cancel_start = content.find('    # Cancel background worker')
cancel_end = content.find('    logger.info(f"Shutting down')
if cancel_start != -1 and cancel_end != -1:
    content = content[:cancel_start] + content[cancel_end:]

with open('backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed main.py')
