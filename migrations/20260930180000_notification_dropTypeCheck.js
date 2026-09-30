exports.up = function (knex) {
  // notification.type must be a free-form string: NotificationType is
  // `string` in the domain and modules emit ~40 distinct types — the enum
  // CHECK rejected every event type added after the table was created.
  return knex.raw('ALTER TABLE "notification" DROP CONSTRAINT "notification_type_check"');
};

exports.down = function (knex) {
  return knex.raw(`ALTER TABLE "notification" ADD CONSTRAINT "notification_type_check"
    CHECK (type IN (
      'account_registration','password_reset','email_verification','order_confirmation',
      'order_shipped','order_delivered','order_cancelled','return_initiated',
      'refund_processed','back_in_stock','price_drop','new_product','review_request',
      'abandoned_cart','coupon_offer','promotion'
    ))`);
};
