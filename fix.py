
import re

for file in ["web/src/pages/Register.jsx", "web/src/pages/Login.jsx"]:
    with open(file, "r") as f:
        content = f.read()
    
    if "Register.jsx" in file:
        content = re.sub(
            r"navigate\(`/verify-email\?email=(.*?)`, \{ replace: true \}\);",
            r"navigate(`../verify-email?email=\1`, { replace: true });",
            content
        )
    else:
        content = content.replace(
            "navigate(from, { replace: true });",
            "const safeFrom = from.startsWith(\"/\") ? from.substring(1) : from;\n      navigate(`../${safeFrom}`, { replace: true });"
        )
        
    with open(file, "w") as f:
        f.write(content)

