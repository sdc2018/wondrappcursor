import TaskModel from '../models/Task';
import NotificationModel, { NotificationType } from '../models/Notification';
import OpportunityModel, { OpportunityStatus } from '../models/Opportunity';
import ClientModel from '../models/Client';
import ServiceModel from '../models/Service';

// Extended Task interface for the joined properties returned by findOverdueTasks
interface ExtendedTask {
  id: number;
  name: string;
  opportunity_id: number;
  assigned_user_id: number;
  due_date: Date;
  status: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  // Additional properties from joined tables
  opportunity_name: string;
  client_name: string;
  service_name: string;
  assigned_user_email: string;
  assigned_user_name: string;
  bu_head_email: string;
  bu_head_name: string;
  business_unit: string;
}

/**
 * WorkflowService handles automated processes like:
 * - Checking for overdue tasks and sending notifications
 * - Updating client services when opportunities are marked as won
 * - Other automated processes as needed
 */
class WorkflowService {
  constructor() {
    // Constructor is empty as we use singleton instances of models
  }

  /**
   * Process overdue tasks and send notifications
   * - Sends notification to task owner
   * - After 24 hours, escalates to BU Head
   */
  async processOverdueTasks(): Promise<void> {
    try {
      // Get all overdue tasks
      const overdueTasks = await TaskModel.findOverdueTasks() as ExtendedTask[];
      
      if (overdueTasks.length === 0) {
        console.log('No overdue tasks found');
        return;
      }
      
      console.log(`Processing ${overdueTasks.length} overdue tasks`);
      
      for (const task of overdueTasks) {
        // Calculate how many hours the task is overdue
        const now = new Date();
        const dueDate = new Date(task.due_date);
        const hoursOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
        
        // Send notification to task owner
          await NotificationModel.create({
            user_id: task.assigned_user_id,
            type: NotificationType.TASK_OVERDUE,
            title: 'Task Overdue',
            message: `Task "${task.name}" is overdue. Please complete it as soon as possible.`,
            related_to: 'task',
          related_id: task.id
          });
          
          console.log(`Sent overdue notification for task ${task.id} to user ${task.assigned_user_id}`);
        
        // If task is overdue by more than 24 hours, escalate to BU Head if available
        // The bu_head_email will be null if no BU Head was found
        if (hoursOverdue >= 24 && task.bu_head_email) {
          // Find the BU Head ID using the business unit
          const buHeadId = await NotificationModel.findBUHeadByBusinessUnit(task.business_unit);
          if (buHeadId) {
              await NotificationModel.create({
              user_id: buHeadId,
                type: NotificationType.TASK_OVERDUE_ESCALATION,
                title: 'Task Overdue Escalation',
              message: `Task "${task.name}" assigned to ${task.assigned_user_name} is more than 24 hours overdue.`,
                related_to: 'task',
              related_id: task.id
              });
              
            console.log(`Escalated overdue task ${task.id} to BU Head ${buHeadId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing overdue tasks:', error);
    }
  }

  /**
   * Process won opportunities and update client services
   * - When an opportunity is marked as won, add the service to the client's services_used
   */
  async processWonOpportunities(): Promise<void> {
    try {
      // Get opportunities with WON status
      const wonOpportunities = await OpportunityModel.findByStatus(OpportunityStatus.WON);
      
      if (wonOpportunities.length === 0) {
        console.log('No won opportunities to process');
        return;
      }
      
      console.log(`Processing ${wonOpportunities.length} won opportunities`);
      
      for (const opportunity of wonOpportunities) {
        // Get the client
        const client = await ClientModel.findById(opportunity.client_id);
        if (!client) {
          console.log(`Client ${opportunity.client_id} not found for opportunity ${opportunity.id}`);
          continue;
        }
        
        // Check if service is already in client's services_used
        if (client.services_used.includes(opportunity.service_id)) {
          console.log(`Service ${opportunity.service_id} already added to client ${client.id}`);
          continue;
        }
        
        // Update client's services_used to include the won service
        await ClientModel.addService(opportunity.client_id, opportunity.service_id);
        
        // Get service details
        const service = await ServiceModel.findById(opportunity.service_id);
        if (!service) continue;
        
        // Notify account owner
        await NotificationModel.create({
          user_id: client.account_owner_id,
          type: NotificationType.OPPORTUNITY_WON,
          title: 'Opportunity Won',
          message: `Opportunity "${opportunity.name}" for service "${service.name}" has been won and added to client's services.`,
          related_to: 'opportunity',
          related_id: opportunity.id
        });
        
        // Find and notify BU Head if possible
        const buHeadId = await NotificationModel.findBUHeadByBusinessUnit(service.business_unit);
        if (buHeadId) {
          await NotificationModel.create({
            user_id: buHeadId,
            type: NotificationType.OPPORTUNITY_WON,
            title: 'Opportunity Won - BU Notification',
            message: `Opportunity "${opportunity.name}" for client "${client.name}" has been won. Service "${service.name}" has been added to client's services.`,
            related_to: 'opportunity',
            related_id: opportunity.id
          });
        }
        
        console.log(`Updated client ${opportunity.client_id} with service ${opportunity.service_id} from won opportunity ${opportunity.id}`);
      }
    } catch (error) {
      console.error('Error processing won opportunities:', error);
    }
  }

  /**
   * Run all workflow processes
   * This method can be called by a scheduler (e.g., cron job)
   */
  async runWorkflows(): Promise<void> {
    console.log('Running workflows...');
    await this.processOverdueTasks();
    await this.processWonOpportunities();
    console.log('Workflows completed');
  }
}

export default new WorkflowService();