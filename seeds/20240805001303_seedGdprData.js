/**
 * GDPR Seed Data
 * Seeds test data for GDPR data requests and cookie consents
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Get test customer
  const testCustomer = await knex('customer')
    .where({ email: 'customer@example.com' })
    .first('customerId');

  if (!testCustomer) {
    
    return;
  }

  const customerId = testCustomer.customerId;

  const now = new Date();
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + 30);

  // Clean up existing GDPR test data
  await knex('gdprDataRequest').where({ customerId }).delete();
  await knex('gdprCookieConsent').where({ customerId }).delete();

  // Seed GDPR Data Requests
  const gdprDataRequests = [
    {
      customerId,
      requestType: 'access',
      status: 'completed',
      reason: 'Want to see my data',
      identityVerified: true,
      verificationMethod: 'email',
      verifiedAt: now,
      deadlineAt: deadline,
      extensionRequested: false,
      processedAt: now,
      processedBy: null,
      downloadUrl: '/api/gdpr/download/test-export-1',
      downloadFormat: 'json',
      downloadExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: now
    },
    {
      customerId,
      requestType: 'restriction',
      status: 'pending',
      reason: 'Data restriction request',
      identityVerified: false,
      deadlineAt: deadline,
      extensionRequested: false,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      createdAt: now,
      updatedAt: now
    }
  ];

  await knex('gdprDataRequest').insert(gdprDataRequests);

  // Seed Cookie Consents
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const cookieConsents = [
    {
      customerId,
      sessionId: 'test-session-001',
      necessary: true,
      functional: true,
      analytics: true,
      marketing: false,
      thirdParty: false,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      country: 'US',
      region: 'CA',
      consentBannerVersion: '1.0',
      consentMethod: 'banner',
      consentedAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now
    },
    {
      customerId: null,
      sessionId: 'anonymous-session-001',
      browserFingerprint: 'test-fingerprint-001',
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      thirdParty: false,
      ipAddress: '192.168.1.1',
      userAgent: 'Anonymous Test Agent',
      country: 'GB',
      consentBannerVersion: '1.0',
      consentMethod: 'banner',
      consentedAt: now,
      expiresAt,
      createdAt: now,
      updatedAt: now
    }
  ];

  await knex('gdprCookieConsent').insert(cookieConsents);

  
};
