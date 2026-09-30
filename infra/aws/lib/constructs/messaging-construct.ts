import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface MessagingConstructProps {
  environment: string;
  /** Deliveries attempted before a message lands in the DLQ. */
  maxReceiveCount?: number;
}

/**
 * Event bus: a single SQS queue (producers + consumer) with a dead-letter
 * queue. The app publishes and consumes via AWS_EVENT_QUEUE_URL when
 * EVENT_BUS_PROVIDER=aws-sqs.
 */
export class MessagingConstruct extends Construct {
  readonly queue: sqs.Queue;
  readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: MessagingConstructProps) {
    super(scope, id);

    const { environment } = props;

    this.deadLetterQueue = new sqs.Queue(this, 'EventsDlq', {
      queueName: `commercefull-events-dlq-${environment}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    this.queue = new sqs.Queue(this, 'EventsQueue', {
      queueName: `commercefull-events-${environment}`,
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: props.maxReceiveCount ?? 10,
      },
    });
  }

  /** Grant send (publish) + consume to a task role. */
  grantSendConsume(grantee: iam.IGrantable): void {
    this.queue.grantSendMessages(grantee);
    this.queue.grantConsumeMessages(grantee);
  }
}
