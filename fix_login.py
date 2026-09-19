
lines = open("web/src/pages/Login.jsx").readlines()
lines[51] = "      const safeFrom = from.startsWith(\"/\") ? from.substring(1) : from;\n      navigate(`${import.meta.env.BASE_URL}${safeFrom}`.replace(\"//\", \"/\"), { replace: true });\n"
open("web/src/pages/Login.jsx", "w").writelines(lines)

