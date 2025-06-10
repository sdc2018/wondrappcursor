// CSV utility functions for import/export functionality

export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const exportToCSV = (data: any[], filename: string, headers?: string[], excludeFields?: string[]): void => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object if not provided
  let csvHeaders = headers;
  if (!csvHeaders) {
    csvHeaders = Object.keys(data[0]).filter(key => !excludeFields?.includes(key));
  }

  // Convert data to CSV format
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      csvHeaders!.map(header => {
        const value = row[header];
        // Handle arrays by joining with semicolons
        if (Array.isArray(value)) {
          return `"${value.join(';')}"`;
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const validateCSVData = (
  data: any[], 
  requiredFields: string[], 
  type?: 'clients' | 'services' | 'opportunities' | 'tasks'
): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    errors.push('CSV file contains no data rows');
    return { valid: false, errors, warnings };
  }

  // Check required fields
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index is 0-based and we skip header row
    
    requiredFields.forEach(field => {
      if (!row[field] || String(row[field]).trim() === '') {
        errors.push(`Row ${rowNumber}: Missing required field "${field}"`);
      }
    });

    // Type-specific validations
    if (type === 'clients') {
      // Validate status (case-insensitive)
      const validStatuses = ['active', 'inactive', 'prospect', 'former'];
      if (row.status) {
        const statusLower = String(row.status).toLowerCase().trim();
        if (!validStatuses.includes(statusLower)) {
          errors.push(`Row ${rowNumber}: Invalid status "${row.status}". Must be one of: ${validStatuses.join(', ')} (case-insensitive)`);
        } else {
          // Normalize the status to lowercase
          row.status = statusLower;
        }
      }
    } else if (type === 'services') {
      // Validate status (case-insensitive)
      const validStatuses = ['active', 'inactive', 'deprecated'];
      if (row.status) {
        const statusLower = String(row.status).toLowerCase().trim();
        if (!validStatuses.includes(statusLower)) {
          errors.push(`Row ${rowNumber}: Invalid status "${row.status}". Must be one of: ${validStatuses.join(', ')} (case-insensitive)`);
        } else {
          // Normalize the status to lowercase
          row.status = statusLower;
        }
      }
    } else if (type === 'opportunities') {
      // Validate status (case-insensitive)
      const validStatuses = ['new', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
      if (row.status) {
        const statusLower = String(row.status).toLowerCase().trim();
        if (!validStatuses.includes(statusLower)) {
          errors.push(`Row ${rowNumber}: Invalid status "${row.status}". Must be one of: ${validStatuses.join(', ')} (case-insensitive)`);
        } else {
          // Normalize the status to lowercase
          row.status = statusLower;
        }
      }
      
      // Validate priority (case-insensitive)
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (row.priority) {
        const priorityLower = String(row.priority).toLowerCase().trim();
        if (!validPriorities.includes(priorityLower)) {
          errors.push(`Row ${rowNumber}: Invalid priority "${row.priority}". Must be one of: ${validPriorities.join(', ')} (case-insensitive)`);
        } else {
          // Normalize the priority to lowercase
          row.priority = priorityLower;
        }
      }
      
      // Validate date format (if provided)
      if (row.due_date && !row.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Row ${rowNumber}: due_date must be in YYYY-MM-DD format. Expected format like "2024-12-31", but got: "${row.due_date}"`);
      }
    } else if (type === 'tasks') {
      // Validate date format (if provided)
      if (row.due_date && !row.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Row ${rowNumber}: due_date must be in YYYY-MM-DD format. Expected format like "2024-12-31", but got: "${row.due_date}"`);
      }
      
      // Validate status (case-insensitive)
      const validStatuses = ['pending', 'in_progress', 'completed', 'on_hold', 'cancelled'];
      if (row.status) {
        const statusLower = String(row.status).toLowerCase().trim();
        if (!validStatuses.includes(statusLower)) {
          errors.push(`Row ${rowNumber}: Invalid status "${row.status}". Must be one of: ${validStatuses.join(', ')} (case-insensitive)`);
        } else {
          // Normalize the status to lowercase
          row.status = statusLower;
        }
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const prepareDataForImport = (data: any[], type: 'clients' | 'services' | 'opportunities' | 'tasks', lookupData?: any): any[] => {
  return data.map(row => {
    // Create a clean copy of the row
    const cleaned = { ...row };
    
    // Remove empty string values and convert to null/undefined where appropriate
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === '') {
        delete cleaned[key];
      }
    });
    
    if (type === 'clients') {
      // Set defaults for missing fields
      if (!cleaned.status || cleaned.status === '') {
        cleaned.status = 'prospect';
      }
      
      // Handle services_used array field
      if (cleaned.services_used && typeof cleaned.services_used === 'string') {
        // Split by semicolon and clean up
        cleaned.services_used = cleaned.services_used
          .split(';')
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '');
      }
      
      // Ensure numeric fields are numbers
      ['account_owner_id'].forEach(field => {
        if (cleaned[field]) {
          cleaned[field] = Number(cleaned[field]);
        }
      });
      
      // Default account_owner_id to admin (31) if not set or invalid
      if (!cleaned.account_owner_id || isNaN(cleaned.account_owner_id)) {
        cleaned.account_owner_id = 31; // Default to admin user
      }
    } else if (type === 'services') {
      // Set defaults for missing fields
      if (!cleaned.status || cleaned.status === '') {
        cleaned.status = 'active';
      }
      
      if (!cleaned.pricing_details || cleaned.pricing_details === '') {
        cleaned.pricing_details = 'Contact for pricing';
      }
      
      if (!cleaned.client_role || cleaned.client_role === '') {
        cleaned.client_role = 'Decision Maker';
      }
      
      if (!cleaned.description || cleaned.description === '') {
        cleaned.description = `${cleaned.name} service offering`;
      }
    } else if (type === 'opportunities') {
      // Handle client lookup (client_name -> client_id)
      if (cleaned.client_name && !cleaned.client_id && lookupData?.clients) {
        const client = lookupData.clients.find((c: any) => 
          c.name.toLowerCase().trim() === String(cleaned.client_name).toLowerCase().trim()
        );
        if (client) {
          cleaned.client_id = client.id;
        } else {
          console.warn(`Client not found: ${cleaned.client_name}`);
        }
      }
      
      // Handle service lookup (service_name -> service_id)
      if (cleaned.service_name && !cleaned.service_id && lookupData?.services) {
        const service = lookupData.services.find((s: any) => 
          s.name.toLowerCase().trim() === String(cleaned.service_name).toLowerCase().trim()
        );
        if (service) {
          cleaned.service_id = service.id;
        } else {
          console.warn(`Service not found: ${cleaned.service_name}`);
        }
      }
      
      // Handle user lookup (assigned_user_name -> assigned_user_id)
      if (cleaned.assigned_user_name && !cleaned.assigned_user_id && lookupData?.users) {
        const user = lookupData.users.find((u: any) => 
          u.username.toLowerCase().trim() === String(cleaned.assigned_user_name).toLowerCase().trim()
        );
        if (user) {
          cleaned.assigned_user_id = user.id;
        } else {
          console.warn(`User not found: ${cleaned.assigned_user_name}`);
        }
      }
      
      // Remove display fields that shouldn't be imported
      delete cleaned.client_name;
      delete cleaned.service_name;
      delete cleaned.assigned_user_name;
      
      // Set defaults for missing fields
      if (!cleaned.status || cleaned.status === '') {
        cleaned.status = 'new';
      }
      
      if (!cleaned.priority || cleaned.priority === '') {
        cleaned.priority = 'medium';
      }
      
      // Set default due_date if not provided (30 days from now for opportunities)
      if (!cleaned.due_date || cleaned.due_date === '') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        cleaned.due_date = futureDate.toISOString().split('T')[0];
      }
      
      // Ensure numeric fields are numbers
      ['client_id', 'service_id', 'assigned_user_id', 'value'].forEach(field => {
        if (cleaned[field]) {
          cleaned[field] = Number(cleaned[field]);
        }
      });
      
      // Default assigned_user_id to admin (31) if still not set
      if (!cleaned.assigned_user_id || isNaN(cleaned.assigned_user_id)) {
        cleaned.assigned_user_id = 31; // Default to admin user
      }
    } else if (type === 'tasks') {
      // Handle opportunity lookup (opportunity_name -> opportunity_id)
      if (cleaned.opportunity_name && !cleaned.opportunity_id && lookupData?.opportunities) {
        const opportunity = lookupData.opportunities.find((o: any) => 
          o.name.toLowerCase().trim() === String(cleaned.opportunity_name).toLowerCase().trim()
        );
        if (opportunity) {
          cleaned.opportunity_id = opportunity.id;
        } else {
          console.warn(`Opportunity not found: ${cleaned.opportunity_name}`);
        }
      }
      
      // Handle user lookup (assigned_user_name -> assigned_user_id)
      if (cleaned.assigned_user_name && !cleaned.assigned_user_id && lookupData?.users) {
        const user = lookupData.users.find((u: any) => 
          u.username.toLowerCase().trim() === String(cleaned.assigned_user_name).toLowerCase().trim()
        );
        if (user) {
          cleaned.assigned_user_id = user.id;
        } else {
          console.warn(`User not found: ${cleaned.assigned_user_name}`);
        }
      }
      
      // Remove display fields that shouldn't be imported
      delete cleaned.opportunity_name;
      delete cleaned.assigned_user_name;
      
      // Set defaults for missing fields
      if (!cleaned.status || cleaned.status === '') {
        cleaned.status = 'pending';
      }
      
      // Set default due_date if not provided (7 days from now for tasks)
      if (!cleaned.due_date || cleaned.due_date === '') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        cleaned.due_date = futureDate.toISOString().split('T')[0];
      }
      
      // Default description if empty
      if (!cleaned.description || cleaned.description === '') {
        cleaned.description = `Task: ${cleaned.name}`;
      }
      
      // Ensure numeric fields are numbers
      ['opportunity_id', 'assigned_user_id'].forEach(field => {
        if (cleaned[field]) {
          cleaned[field] = Number(cleaned[field]);
        }
      });
      
      // Default assigned_user_id to admin (31) if still not set
      if (!cleaned.assigned_user_id || isNaN(cleaned.assigned_user_id)) {
        cleaned.assigned_user_id = 31; // Default to admin user
      }
      
      // Default opportunity_id if still not set (use first available opportunity)
      if (!cleaned.opportunity_id || isNaN(cleaned.opportunity_id)) {
        if (lookupData?.opportunities && lookupData.opportunities.length > 0) {
          cleaned.opportunity_id = lookupData.opportunities[0].id;
        } else {
          cleaned.opportunity_id = 1; // Default fallback
        }
      }
    }
    
    return cleaned;
  });
};

export const exportForImport = (data: any[], filename: string, type: 'clients' | 'services' | 'opportunities' | 'tasks'): void => {
  // Define fields to exclude for each type
  const excludeFields = {
    clients: ['id', 'created_at', 'updated_at'],
    services: ['id', 'created_at', 'updated_at'],
    opportunities: ['id', 'created_at', 'updated_at', 'client_name', 'service_name', 'service_business_unit', 'assigned_user_name'],
    tasks: ['id', 'created_at', 'updated_at', 'opportunity_id', 'assigned_user_id']
  };

  exportToCSV(data, filename, undefined, excludeFields[type]);
};