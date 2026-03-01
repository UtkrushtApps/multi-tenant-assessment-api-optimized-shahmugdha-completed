// This script is executed by the MongoDB Docker entrypoint during
// initialisation. It uses the legacy mongo shell API.

// Create and select the application database
var dbName = 'utkrusht_multitenant';
var dbApp = db.getSiblingDB(dbName);

// Create an application user (credentials are also referenced in the Node.js app)
dbApp.createUser({
  user: 'utkrusht_user',
  pwd: 'utkrusht_pass',
  roles: [{ role: 'readWrite', db: dbName }],
});

// Drop collections if they already exist (for idempotency in local runs)
if (dbApp.tenants) {
  dbApp.tenants.drop();
}
if (dbApp.assessments) {
  dbApp.assessments.drop();
}
if (dbApp.submissions) {
  dbApp.submissions.drop();
}

// Create a few tenants: one significantly larger than the others
var tenants = [
  { tenantId: 'tenant-small-1', name: 'Small Startup A', plan: 'basic' },
  { tenantId: 'tenant-small-2', name: 'Small Startup B', plan: 'basic' },
  { tenantId: 'tenant-medium-1', name: 'Growing Company C', plan: 'growth' },
  { tenantId: 'tenant-large-1', name: 'Enterprise X', plan: 'enterprise' },
];

dbApp.tenants.insertMany(tenants);

// Helper to create assessments per tenant
function createAssessmentsForTenant(tenantId, count) {
  var assessments = [];
  for (var i = 0; i < count; i++) {
    assessments.push({
      tenantId: tenantId,
      title: 'Assessment ' + (i + 1) + ' for ' + tenantId,
      category: i % 2 === 0 ? 'backend' : 'frontend',
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  var result = dbApp.assessments.insertMany(assessments);
  return result.insertedIds;
}

// Create assessments for all tenants
var assessmentIdsByTenant = {};
for (var t = 0; t < tenants.length; t++) {
  var tenant = tenants[t];
  var ids = createAssessmentsForTenant(tenant.tenantId, 8);
  assessmentIdsByTenant[tenant.tenantId] = Object.values(ids);
}

// Helper to generate a pseudo-random status
function randomStatus(i) {
  var r = i % 10;
  if (r < 5) return 'passed';
  if (r < 8) return 'failed';
  return 'in-progress';
}

// Helper to generate submissions for a tenant
function createSubmissionsForTenant(tenantId, assessmentIds, count) {
  var submissions = [];
  var baseDate = new Date();

  for (var i = 0; i < count; i++) {
    var assessmentId = assessmentIds[i % assessmentIds.length];
    var status = randomStatus(i);
    var score = status === 'passed' ? 70 + (i % 30) : 30 + (i % 40);

    // Simulate slightly heavier answer documents
    var answers = [];
    for (var q = 0; q < 5; q++) {
      answers.push({
        questionId: 'q' + q,
        selectedOption: 'option-' + ((i + q) % 4),
        correct: ((i + q) % 3) === 0,
      });
    }

    // Spread createdAt over time
    var createdAt = new Date(baseDate.getTime() - i * 60000);

    submissions.push({
      tenantId: tenantId,
      assessmentId: assessmentId,
      userId: tenantId + '-user-' + (i % 1000),
      status: status,
      score: score,
      createdAt: createdAt,
      answers: answers,
    });

    // Insert in batches to avoid very large single inserts
    if (submissions.length === 5000) {
      dbApp.submissions.insertMany(submissions);
      submissions = [];
    }
  }

  if (submissions.length > 0) {
    dbApp.submissions.insertMany(submissions);
  }
}

// Insert different volumes per tenant to simulate imbalance
// Small tenants: a few thousand submissions
createSubmissionsForTenant('tenant-small-1', assessmentIdsByTenant['tenant-small-1'], 5000);
createSubmissionsForTenant('tenant-small-2', assessmentIdsByTenant['tenant-small-2'], 7000);

// Medium tenant: more submissions
createSubmissionsForTenant('tenant-medium-1', assessmentIdsByTenant['tenant-medium-1'], 30000);

// Large tenant: significantly more submissions
createSubmissionsForTenant('tenant-large-1', assessmentIdsByTenant['tenant-large-1'], 150000);

// Basic collection stats log
print('Seed data inserted into ' + dbName + ' database.');
print('Tenants: ' + dbApp.tenants.countDocuments());
print('Assessments: ' + dbApp.assessments.countDocuments());
print('Submissions: ' + dbApp.submissions.countDocuments());
