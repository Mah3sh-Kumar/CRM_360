import os

pages_dir = r'm:\CRM_KIMI\src\pages'
pages = ['Leads.tsx', 'Accounts.tsx', 'Contacts.tsx', 'Tasks.tsx', 'Meetings.tsx', 'Activities.tsx', 'Customers.tsx', 'Employees.tsx', 'Visits.tsx', 'Reports.tsx']

for page in pages:
    path = os.path.join(pages_dir, page)
    if not os.path.exists(path): continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    entity = page.replace('.tsx', '').lower()
    if entity == 'activities': entity = 'activities'
    elif entity.endswith('s'): entity = entity[:-1] + 's' # Just keep it plural

    # Add emptyMessage
    replacement = f"<DataTable emptyMessage={{pool.length === 0 ? 'No {entity} found. Create your first {entity} to get started.' : 'No matching {entity} found.'}} "
    if '<DataTable' in content and 'emptyMessage' not in content:
        content = content.replace('<DataTable', replacement, 1)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Special case for Opportunities since it might not use DataTable directly or we want a custom message
opp_path = os.path.join(pages_dir, 'Opportunities.tsx')
if os.path.exists(opp_path):
    with open(opp_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # It does not use DataTable, it uses custom rendering with pool
    # Wait, in Opportunities it renders custom cards or rows? We should check what it renders.
    pass

