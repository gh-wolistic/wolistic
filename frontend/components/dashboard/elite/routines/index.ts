// Client Manager v2 Components - Centralized exports

// Small reusable components
export { SourceBadge } from './SourceBadge';
export { StatusBadge } from './StatusBadge';
export { ProgressBar } from './ProgressBar';
export { MetricCard } from './MetricCard';
export { EmptyState } from './EmptyState';
export { AcquisitionBreakdown } from './AcquisitionBreakdown';

// Stage 1: List view components
export { ClientCard } from './ClientCard';
export { FiltersBar } from './FiltersBar';
export { TabsNavigation } from './TabsNavigation';
export type { TabType } from './TabsNavigation';

// Stage 2: Detail view components
export { ActiveRoutineSection } from './ActiveRoutineSection';
export { UpcomingSessionsSection } from './UpcomingSessionsSection';
export { FollowUpsSection } from './FollowUpsSection';
export { PerformanceMetricsSection } from './PerformanceMetricsSection';
export { ClientProfileSidebar } from './ClientProfileSidebar';
export { ClientDetailSheet } from './ClientDetailSheet';

// Stage 3: Routine editor
export { RoutineItemCard } from './RoutineItemCard';
export { RoutineEditorModal } from './RoutineEditorModal';

// Stage 4: Template management & bulk assign
export { TemplateRoutineCard } from './TemplateRoutineCard';
export { BulkAssignModal } from './BulkAssignModal';

// Client details for invited clients
export { ClientDetailsForm } from './ClientDetailsForm';

// Follow-up management
export { AddFollowUpModal } from './AddFollowUpModal';

// Client invitation
export { InviteClientModal } from './InviteClientModal';
