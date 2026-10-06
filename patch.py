import sys

css_overrides = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 135 15% 98%;
    --foreground: 135 60% 12%;
    --card: 0 0% 100%;
    --card-foreground: 135 60% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 135 60% 12%;
    --primary: 135 100% 25%;
    --primary-foreground: 60 9% 97%;
    --primary-hover: 132 83% 23%;
    --secondary: 135 20% 93%;
    --secondary-foreground: 135 60% 12%;
    --muted: 135 14% 93%;
    --muted-foreground: 135 8% 40%;
    --muted-bg: 135 27% 96%;
    --accent: 133 29% 64%;
    --accent-foreground: 135 60% 12%;
    --destructive: 4 72% 46%;
    --destructive-foreground: 60 9% 97%;
    --destructive-bg: 9 72% 94%;
    --destructive-border: 11 58% 85%;
    --border: 135 20% 88%;
    --input: 135 20% 88%;
    --ring: 135 100% 25%;
    --radius: 0.5rem;

    /* Semantic Additions */
    --success: 140 75% 24%;
    --success-bg: 139 39% 91%;
    --success-border: 139 31% 80%;
    
    --warning: 44 68% 28%;
    --warning-bg: 43 72% 93%;
    --warning-border: 43 45% 82%;
    
    --info: 211 48% 34%;
    --info-bg: 213 53% 95%;
    --info-border: 212 40% 86%;

    --neutral: 60 4% 40%;
    --neutral-bg: 60 14% 96%;
    --neutral-border: 60 10% 86%;

    --link: 153 79% 20%;
    
    --sidebar-background: 135 47% 15%;
    --sidebar-foreground: 135 20% 85%;
    --sidebar-border: 135 30% 50%;
    --sidebar-accent: 135 40% 60%;
    
    --ink: 135 60% 12%;
    --sage: 133 29% 64%;
    
    --chart-1: 135 100% 25%;
    --chart-2: 135 60% 35%;
    --chart-3: 135 50% 45%;
    --chart-4: 135 40% 55%;
    --chart-5: 135 30% 65%;
  }

  [data-role="Super Admin"] {
    --background: 262 30% 98%;
    --foreground: 262 60% 12%;
    --card: 0 0% 100%;
    --card-foreground: 262 60% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 262 60% 12%;
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 100%;
    --primary-hover: 262 83% 48%;
    --secondary: 262 20% 94%;
    --secondary-foreground: 262 60% 12%;
    --muted: 262 14% 93%;
    --muted-foreground: 262 15% 40%;
    --muted-bg: 262 30% 96%;
    --accent: 262 30% 64%;
    --accent-foreground: 262 60% 12%;
    --border: 262 20% 88%;
    --input: 262 20% 88%;
    --ring: 262 83% 58%;
    --sidebar-background: 262 47% 15%;
    --sidebar-foreground: 262 20% 85%;
    --sidebar-border: 262 30% 50%;
    --sidebar-accent: 262 40% 60%;
    --ink: 262 60% 12%;
    --sage: 262 83% 75%;
    --chart-1: 262 83% 58%;
    --chart-2: 262 60% 48%;
    --chart-3: 262 50% 65%;
    --chart-4: 262 40% 75%;
    --chart-5: 262 30% 85%;
  }

  [data-role="Company Admin"] {
    --background: 221 30% 98%;
    --foreground: 221 60% 12%;
    --card: 0 0% 100%;
    --card-foreground: 221 60% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 221 60% 12%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --primary-hover: 221 83% 43%;
    --secondary: 221 20% 94%;
    --secondary-foreground: 221 60% 12%;
    --muted: 221 14% 93%;
    --muted-foreground: 221 15% 40%;
    --muted-bg: 221 30% 96%;
    --accent: 221 30% 64%;
    --accent-foreground: 221 60% 12%;
    --border: 221 20% 88%;
    --input: 221 20% 88%;
    --ring: 221 83% 53%;
    --sidebar-background: 221 47% 15%;
    --sidebar-foreground: 221 20% 85%;
    --sidebar-border: 221 30% 50%;
    --sidebar-accent: 221 40% 60%;
    --ink: 221 60% 12%;
    --sage: 221 83% 75%;
    --chart-1: 221 83% 53%;
    --chart-2: 221 60% 43%;
    --chart-3: 221 50% 65%;
    --chart-4: 221 40% 75%;
    --chart-5: 221 30% 85%;
  }

  [data-role="Employee"] {
    --background: 38 30% 98%;
    --foreground: 38 60% 15%;
    --card: 0 0% 100%;
    --card-foreground: 38 60% 15%;
    --popover: 0 0% 100%;
    --popover-foreground: 38 60% 15%;
    --primary: 38 92% 44%;
    --primary-foreground: 0 0% 100%;
    --primary-hover: 38 92% 34%;
    --secondary: 38 20% 93%;
    --secondary-foreground: 38 60% 15%;
    --muted: 38 14% 93%;
    --muted-foreground: 38 15% 40%;
    --muted-bg: 38 30% 95%;
    --accent: 38 30% 64%;
    --accent-foreground: 38 60% 15%;
    --border: 38 20% 88%;
    --input: 38 20% 88%;
    --ring: 38 92% 44%;
    --sidebar-background: 38 47% 15%;
    --sidebar-foreground: 38 20% 85%;
    --sidebar-border: 38 30% 50%;
    --sidebar-accent: 38 40% 60%;
    --ink: 38 60% 15%;
    --sage: 38 92% 65%;
    --chart-1: 38 92% 44%;
    --chart-2: 38 60% 55%;
    --chart-3: 38 50% 65%;
    --chart-4: 38 40% 75%;
    --chart-5: 38 30% 85%;
  }
}
"""

file_path = r'm:\CRM_KIMI\src\index.css'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split('@layer base {\n  * { @apply border-border; }')
if len(parts) == 2:
    new_content = css_overrides + '\n@layer base {\n  * { @apply border-border; }' + parts[1]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Updated index.css successfully.')
else:
    print('Failed to split index.css')
