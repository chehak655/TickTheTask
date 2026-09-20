with open('web/src/context/ReminderContext.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Disable checkReminders polling
content = content.replace('intervalRef.current = setInterval(checkReminders, 15000);', '    // intervalRef.current = setInterval(checkReminders, 15000);')

with open('web/src/context/ReminderContext.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
