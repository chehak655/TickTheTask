with open('backend/app/services/auth_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the Dispatch block
import re
content = re.sub(r'    # Dispatch verification OTP email.*?print\(f"\[FALLBACK OTP\] \{user\.email\}: \{otp\}"\)\n', '', content, flags=re.DOTALL)

with open('backend/app/services/auth_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
