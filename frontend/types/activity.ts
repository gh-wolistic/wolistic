// Unified Activity types for the Kanban board

export type ActivityStatus = 'yet-to-start' | 'in-progress' | 'accepted' | 'completed' | 'rejected';
export type ActivityType = 'booking' | 'todo' | 'wolistic';
export type TodoPriority = 'low' | 'medium' | 'high';

export interface BaseActivity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  createdAt: string;
}

export interface BookingActivity extends BaseActivity {
  type: 'booking';
  bookingReference: string;
  clientName: string;
  clientInitials: string;
  serviceName: string;
  scheduledTime: string | null;
  scheduledDate: string | null;
}

export interface TodoActivity extends BaseActivity {
  type: 'todo';
  todoId: number;
  priority: TodoPriority;
  description?: string;
  dueDate?: string;
}

export interface WolisticActivity extends BaseActivity {
  type: 'wolistic';
  templateId: number;
  description: string;
  category: string;
  priority: string;
}

export type Activity = BookingActivity | TodoActivity | WolisticActivity;

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueDate?: string;
}
