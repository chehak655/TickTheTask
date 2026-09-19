with open('app/main.py', 'r') as f:
    lines = f.readlines()

with open('app/main.py', 'w') as f:
    skip = False
    for line in lines:
        if line.strip() == 'app.add_middleware(':
            f.write("app.add_middleware(\n")
            f.write("    CORSMiddleware,\n")
            f.write("    allow_origins=settings.BACKEND_CORS_ORIGINS,\n")
            f.write("    allow_credentials=True,\n")
            f.write("    allow_methods=['*'],\n")
            f.write("    allow_headers=['*'],\n")
            f.write(")\n")
            skip = True
        elif skip and line.strip() == ')':
            skip = False
        elif not skip:
            f.write(line)
