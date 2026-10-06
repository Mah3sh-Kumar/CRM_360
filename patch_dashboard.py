import os

path = r'm:\CRM_KIMI\src\pages\Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace constants
old_consts = """const GREEN = '#007f24', SAGE = '#85c093', INK = '#09352e';
const DESTRUCTIVE = '#b03a26', MUTED_FG = '#71807e', TOOLTIP_BG = '#f0f4ec', TOOLTIP_BORDER = '#dfe4da';
const CHART_FG = '#4d5a52';
const PIPELINE_COLORS = [INK, GREEN, SAGE, '#c8dec9', '#e3efe4'];"""

new_consts = """const CHART_1 = 'hsl(var(--chart-1))', CHART_2 = 'hsl(var(--chart-2))', CHART_3 = 'hsl(var(--chart-3))';
const CHART_4 = 'hsl(var(--chart-4))', CHART_5 = 'hsl(var(--chart-5))';
const DESTRUCTIVE = 'hsl(var(--destructive))', MUTED_FG = 'hsl(var(--muted-foreground))', TOOLTIP_BG = 'hsl(var(--popover))', TOOLTIP_BORDER = 'hsl(var(--border))';
const CHART_FG = 'hsl(var(--foreground))';
const PIPELINE_COLORS = [CHART_1, CHART_2, CHART_3, CHART_4, CHART_5];"""

content = content.replace(old_consts, new_consts)

# Replace activityMix
old_activity = """  const activityMix = [
    { name: 'Tasks Completed', value: tasks.filter(t => t.status === 'Completed').length || 1, fill: INK },
    { name: 'Visits Completed', value: 4, fill: GREEN },
    { name: 'Meetings Conducted', value: 2, fill: SAGE },
  ];"""

new_activity = """  const activityMix = [
    { name: 'Tasks Completed', value: tasks.filter(t => t.status === 'Completed').length || 1, fill: CHART_1 },
    { name: 'Visits Completed', value: 4, fill: CHART_2 },
    { name: 'Meetings Conducted', value: 2, fill: CHART_3 },
  ];"""

content = content.replace(old_activity, new_activity)

# Replace leadStatus BarChart
old_bar = """<Cell key={i} fill={d.s === 'Lost' ? DESTRUCTIVE : d.s === 'Won' ? INK : d.s === 'New' ? SAGE : GREEN} />"""
new_bar = """<Cell key={i} fill={d.s === 'Lost' ? DESTRUCTIVE : d.s === 'Won' ? CHART_1 : d.s === 'New' ? CHART_3 : CHART_2} />"""

content = content.replace(old_bar, new_bar)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard patched.")
