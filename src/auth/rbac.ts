import type { SessionUser, Role } from '@/store/crm';

export type Action = 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE' | 'ASSIGN' | 'EXPORT' | 'ADMINISTRATE';
export type Module = 'COMPANY' | 'EMPLOYEE' | 'CUSTOMER' | 'LEAD' | 'ACCOUNT' | 'CONTACT' | 'OPPORTUNITY' | 'ACTIVITY' | 'TASK' | 'MEETING' | 'VISIT' | 'TRACKING' | 'AUDIT' | 'REPORT';

// Helper: Does employee belong to manager's team?
// In a real backend, this would recursively check the hierarchy via SQL or Graph.
// Here we mock it by checking if the record's owner/assignee matches the manager's team.
export function isTeamMember(managerName: string, employeeName: string, employees: any[]): boolean {
  if (managerName === employeeName) return true;
  const emp = employees.find(e => e.name === employeeName);
  if (!emp) return false;
  return emp.manager === managerName;
}

export function can(action: Action, module: Module, user: SessionUser | null, record?: any, allEmployees?: any[]): boolean {
  if (!user) return false;

  // Super Admin can do almost everything, subject to specific business rules
  if (user.role === 'Super Admin') {
    return true; // Super Admin bypasses most row-level checks, though backend may have constraints
  }

  // Record-level isolation: Company Admin, Manager, Employee must be in the same company
  if (record && record.companyId && record.companyId !== user.companyId) {
    return false;
  }

  // Evaluate by Module
  switch (module) {
    case 'COMPANY':
      if (action === 'VIEW') return ['Company Admin', 'Manager'].includes(user.role);
      return false; // Only Super Admin can Create/Edit/Delete/Activate companies

    case 'EMPLOYEE':
      if (user.role === 'Company Admin') return true; // Own-company employee management
      if (user.role === 'Manager') {
        if (action === 'VIEW' && record) return isTeamMember(user.name, record.name, allEmployees || []);
        return false;
      }
      if (user.role === 'Employee') {
        if (action === 'VIEW' && record) return record.name === user.name;
        return false;
      }
      return false;

    case 'CUSTOMER':
      if (action === 'CREATE' || action === 'EDIT') return user.role === 'Company Admin';
      if (action === 'VIEW') {
        if (user.role === 'Company Admin') return true;
        if (user.role === 'Manager' && record) return isTeamMember(user.name, record.owner, allEmployees || []);
        if (user.role === 'Employee' && record) return record.owner === user.name;
        return ['Company Admin', 'Manager', 'Employee'].includes(user.role);
      }
      return false;

    case 'LEAD':
    case 'ACCOUNT':
    case 'CONTACT':
    case 'OPPORTUNITY':
    case 'ACTIVITY':
    case 'TASK':
    case 'MEETING':
      if (action === 'CREATE') return true;
      if (action === 'DELETE') return false; // Only Super Admin deletes (unless specific overrides)

      if (action === 'VIEW' || action === 'EDIT') {
        if (user.role === 'Company Admin') return true;
        if (user.role === 'Manager' && record) {
          // e.g. record.owner or record.assignee
          const owner = record.owner || record.assignee || record.organizer;
          return isTeamMember(user.name, owner, allEmployees || []);
        }
        if (user.role === 'Employee' && record) {
          const owner = record.owner || record.assignee || record.organizer;
          return owner === user.name;
        }
        return true;
      }
      return false;

    case 'VISIT':
    case 'TRACKING':
      if (action === 'CREATE') return user.role === 'Employee'; // Employees do check-ins
      if (action === 'VIEW') {
        if (user.role === 'Company Admin') return true;
        if (user.role === 'Manager' && record) return isTeamMember(user.name, record.employee, allEmployees || []);
        if (user.role === 'Employee' && record) return record.employee === user.name;
        return true;
      }
      return false;

    case 'REPORT':
      // Reports scope themselves; we just check if they have access to the module
      return true;

    case 'AUDIT':
      if (user.role === 'Company Admin') return true;
      return false;

    default:
      return false;
  }
}

export function getDataScope(module: Module, user: SessionUser | null, records: any[], allEmployees: any[]): any[] {
  if (!user) return [];

  // 1. Tenant Isolation
  let scoped = user.role === 'Super Admin' ? records : records.filter(r => !r.companyId || r.companyId === user.companyId);

  // 2. Role-based scoping
  if (user.role === 'Company Admin' || user.role === 'Super Admin') {
    return scoped;
  }

  // Manager and Employee scoping
  scoped = scoped.filter(record => {
    switch (module) {
      case 'EMPLOYEE':
        if (user.role === 'Manager') return isTeamMember(user.name, record.name, allEmployees);
        return record.name === user.name;
        
      case 'CUSTOMER':
      case 'LEAD':
      case 'ACCOUNT':
      case 'CONTACT':
      case 'OPPORTUNITY':
      case 'ACTIVITY':
        if (user.role === 'Manager') return isTeamMember(user.name, record.owner, allEmployees);
        return record.owner === user.name;

      case 'TASK':
        if (user.role === 'Manager') return isTeamMember(user.name, record.assignee, allEmployees);
        return record.assignee === user.name;

      case 'MEETING':
        if (user.role === 'Manager') return isTeamMember(user.name, record.organizer, allEmployees);
        return record.organizer === user.name;

      case 'VISIT':
      case 'TRACKING':
        if (user.role === 'Manager') return isTeamMember(user.name, record.employee, allEmployees);
        return record.employee === user.name;

      case 'COMPANY':
        return true; // Managers can view own company, filtered by tenant isolation above. Employees cannot (blocked at nav).

      case 'AUDIT':
        return false; // Blocked for Manager/Employee

      default:
        return false;
    }
  });

  return scoped;
}

// ---- RBAC (SRS access matrix) ----
export function navAllowed(role: Role, page: string): boolean {
  // Use our centralized RBAC logic for navigation as well
  // For simplicity, map pages to modules
  const moduleMap: Record<string, Module> = {
    'companies': 'COMPANY',
    'employees': 'EMPLOYEE',
    'customers': 'CUSTOMER',
    'leads': 'LEAD',
    'accounts': 'ACCOUNT',
    'contacts': 'CONTACT',
    'opportunities': 'OPPORTUNITY',
    'activities': 'ACTIVITY',
    'tasks': 'TASK',
    'meetings': 'MEETING',
    'tracking': 'TRACKING',
    'visits': 'VISIT',
    'audit-logs': 'AUDIT',
  };

  const module = moduleMap[page];
  if (!module) return true; // Default allow for Dashboard, Reports, etc. if not strictly mapped here.

  // Simulate a minimal context check for navigation
  const mockUser = { role, name: '', email: '', code: '', companyId: '', company: '', designation: '', manager: '', id: '' } as SessionUser;
  return can('VIEW', module, mockUser, null, []);
}
