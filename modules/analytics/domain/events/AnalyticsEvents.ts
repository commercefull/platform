/**
 * Analytics Domain Events
 * Events for tracking, reporting, and analytics operations
 */

// ============================================================================
// Tracking Events
// ============================================================================

export interface PageViewTrackedEvent {
  type: 'analytics.pageview.tracked';
  payload: {
    sessionId: string;
    customerId?: string;
    pageUrl: string;
    pageTitle?: string;
    referrer?: string;
    userAgent?: string;
    timestamp: string;
  };
}

export interface ProductViewTrackedEvent {
  type: 'analytics.product_view.tracked';
  payload: {
    sessionId: string;
    customerId?: string;
    productId: string;
    productName: string;
    categoryId?: string;
    price?: number;
    timestamp: string;
  };
}

export interface SearchTrackedEvent {
  type: 'analytics.search.tracked';
  payload: {
    sessionId: string;
    customerId?: string;
    query: string;
    resultsCount: number;
    filters?: Record<string, any>;
    timestamp: string;
  };
}

export interface CartEventTrackedEvent {
  type: 'analytics.cart_event.tracked';
  payload: {
    sessionId: string;
    customerId?: string;
    basketId: string;
    eventType: 'add' | 'remove' | 'update' | 'clear';
    productId?: string;
    quantity?: number;
    value?: number;
    timestamp: string;
  };
}

export interface CheckoutEventTrackedEvent {
  type: 'analytics.checkout_event.tracked';
  payload: {
    sessionId: string;
    customerId?: string;
    checkoutId: string;
    step: string;
    value?: number;
    timestamp: string;
  };
}

export interface ConversionTrackedEvent {
  type: 'analytics.conversion.tracked';
  payload: {
    sessionId: string;
    customerId?: string;
    orderId: string;
    orderNumber: string;
    revenue: number;
    currency: string;
    itemCount: number;
    timestamp: string;
  };
}

// ============================================================================
// Report Events
// ============================================================================

export interface ReportGeneratedEvent {
  type: 'analytics.report.generated';
  payload: {
    reportId: string;
    reportType: string;
    dateRange: {
      start: string;
      end: string;
    };
    generatedBy?: string;
    format: 'json' | 'csv' | 'pdf';
    timestamp: string;
  };
}

export interface ReportScheduledEvent {
  type: 'analytics.report.scheduled';
  payload: {
    scheduleId: string;
    reportType: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    createdBy?: string;
    timestamp: string;
  };
}

export interface ReportExportedEvent {
  type: 'analytics.report.exported';
  payload: {
    reportId: string;
    reportType: string;
    format: string;
    fileSize: number;
    exportedBy?: string;
    timestamp: string;
  };
}

// ============================================================================
// Dashboard Events
// ============================================================================

export interface DashboardCreatedEvent {
  type: 'analytics.dashboard.created';
  payload: {
    dashboardId: string;
    name: string;
    widgets: string[];
    createdBy?: string;
    timestamp: string;
  };
}

export interface DashboardWidgetAddedEvent {
  type: 'analytics.dashboard.widget_added';
  payload: {
    dashboardId: string;
    widgetId: string;
    widgetType: string;
    configuration: Record<string, any>;
    timestamp: string;
  };
}

// ============================================================================
// Segment Events
// ============================================================================

export interface CustomerSegmentCreatedEvent {
  type: 'analytics.segment.created';
  payload: {
    segmentId: string;
    name: string;
    criteria: Record<string, any>;
    estimatedSize: number;
    createdBy?: string;
    timestamp: string;
  };
}

export interface CustomerSegmentUpdatedEvent {
  type: 'analytics.segment.updated';
  payload: {
    segmentId: string;
    name: string;
    changes: string[];
    newSize: number;
    updatedBy?: string;
    timestamp: string;
  };
}

export interface CustomerAddedToSegmentEvent {
  type: 'analytics.segment.customer_added';
  payload: {
    segmentId: string;
    customerId: string;
    timestamp: string;
  };
}

// ============================================================================
// Cohort Events
// ============================================================================

export interface CohortCreatedEvent {
  type: 'analytics.cohort.created';
  payload: {
    cohortId: string;
    name: string;
    cohortType: string;
    startDate: string;
    size: number;
    createdBy?: string;
    timestamp: string;
  };
}

export interface CohortAnalysisCompletedEvent {
  type: 'analytics.cohort.analysis_completed';
  payload: {
    cohortId: string;
    analysisType: string;
    metrics: Record<string, number>;
    timestamp: string;
  };
}

// ============================================================================
// Type Union
// ============================================================================

export type AnalyticsEventType =
  // Tracking events
  | 'analytics.pageview.tracked'
  | 'analytics.product_view.tracked'
  | 'analytics.search.tracked'
  | 'analytics.cart_event.tracked'
  | 'analytics.checkout_event.tracked'
  | 'analytics.conversion.tracked'
  // Report events
  | 'analytics.report.generated'
  | 'analytics.report.scheduled'
  | 'analytics.report.exported'
  // Dashboard events
  | 'analytics.dashboard.created'
  | 'analytics.dashboard.widget_added'
  // Segment events
  | 'analytics.segment.created'
  | 'analytics.segment.updated'
  | 'analytics.segment.customer_added'
  // Cohort events
  | 'analytics.cohort.created'
  | 'analytics.cohort.analysis_completed';

export type AnalyticsEvent =
  | PageViewTrackedEvent
  | ProductViewTrackedEvent
  | SearchTrackedEvent
  | CartEventTrackedEvent
  | CheckoutEventTrackedEvent
  | ConversionTrackedEvent
  | ReportGeneratedEvent
  | ReportScheduledEvent
  | ReportExportedEvent
  | DashboardCreatedEvent
  | DashboardWidgetAddedEvent
  | CustomerSegmentCreatedEvent
  | CustomerSegmentUpdatedEvent
  | CustomerAddedToSegmentEvent
  | CohortCreatedEvent
  | CohortAnalysisCompletedEvent;
