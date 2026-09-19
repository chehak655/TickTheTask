
lines = open("web/src/pages/Register.jsx").readlines()
lines[80] = "      navigate(`${import.meta.env.BASE_URL}verify-email?email=${encodeURIComponent(formData.email.trim())}`.replace(\"//\", \"/\"), { replace: true });\n"
open("web/src/pages/Register.jsx", "w").writelines(lines)

