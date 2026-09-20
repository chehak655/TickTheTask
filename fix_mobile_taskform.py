with open('mobile/src/components/TaskForm.js', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('        {/* Reminder Selector */}')
end = content.find('        {/* Form Actions */}')
if start != -1 and end != -1:
    content = content[:start] + content[end:]

with open('mobile/src/components/TaskForm.js', 'w', encoding='utf-8') as f:
    f.write(content)
