import re

with open('web/src/components/TaskCard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove reminder badge
start = content.find('            {/* Reminder Badge */}')
end = content.find('            {/* Due Date Badge */}')
if start != -1 and end != -1:
    content = content[:start] + content[end:]

with open('web/src/components/TaskCard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('mobile/src/components/TaskCard.js', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('            {/* Reminder Badge */}')
end = content.find('            {/* Due Date Badge */}')
if start != -1 and end != -1:
    content = content[:start] + content[end:]

with open('mobile/src/components/TaskCard.js', 'w', encoding='utf-8') as f:
    f.write(content)
