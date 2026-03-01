const express = require('express');
const { Tenant, Submission, Assessment } = require('../models/models');
const { validateTenantIdQuery, validatePaginationQuery } = require('../schemas/schemas');
const { validateRequest } = require('../middleware/middleware');
const { parsePagination } = require('../utils/helpers');

const router = express.Router();

// GET /api/tenants - list all tenants (for convenience)
router.get('/tenants', async (req, res, next) => {
  try {
    const tenants = await Tenant.find({}).lean();
    res.json({ tenants });
  } catch (err) {
    next(err);
  }
});

// GET /api/tenants/:tenantId/submissions
// Returns paginated submissions for a tenant with optional status filter.
// Implementation is intentionally straightforward and may not be optimal at scale.
router.get(
  '/tenants/:tenantId/submissions',
  validateRequest(validateTenantIdQuery),
  validateRequest(validatePaginationQuery),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId;
      const { page, limit } = parsePagination(req.query);
      const statusFilter = req.query.status;

      // Ensure tenant exists (simple lookup by tenantId)
      const tenant = await Tenant.findOne({ tenantId }).lean();
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const query = { tenantId };

      if (statusFilter) {
        // Apply status filter later in memory for simplicity
        // (this keeps the query generic but may load more data than necessary)
      }

      const skip = (page - 1) * limit;

      // Fetch a page of submissions for this tenant
      const submissions = await Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Basic status filtering done in memory
      const filteredSubmissions = statusFilter
        ? submissions.filter((s) => s.status === statusFilter)
        : submissions;

      // For each submission, fetch the related assessment separately
      // (simple but can lead to multiple queries per request)
      const detailedSubmissions = [];
      for (const sub of filteredSubmissions) {
        const assessment = await Assessment.findById(sub.assessmentId).lean();
        detailedSubmissions.push({
          ...sub,
          assessmentTitle: assessment ? assessment.title : null,
          assessmentCategory: assessment ? assessment.category : null,
        });
      }

      // Count total submissions for pagination metadata
      const totalCount = await Submission.countDocuments({ tenantId });

      res.json({
        tenant: {
          tenantId: tenant.tenantId,
          name: tenant.name,
          plan: tenant.plan,
        },
        meta: {
          page,
          limit,
          total: totalCount,
        },
        submissions: detailedSubmissions,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tenants/:tenantId/summary
// Returns a simple summary of submissions for a tenant.
// Implementation currently performs aggregation-like work in application code.
router.get(
  '/tenants/:tenantId/summary',
  validateRequest(validateTenantIdQuery),
  async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId;

      const tenant = await Tenant.findOne({ tenantId }).lean();
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Load all submissions for this tenant and compute summary in memory
      // This is straightforward but can become expensive for large tenants.
      const submissions = await Submission.find({ tenantId }).lean();

      let total = submissions.length;
      let passed = 0;
      let failed = 0;
      let inProgress = 0;
      let totalScore = 0;

      for (const sub of submissions) {
        if (sub.status === 'passed') passed += 1;
        if (sub.status === 'failed') failed += 1;
        if (sub.status === 'in-progress') inProgress += 1;
        totalScore += sub.score;
      }

      const avgScore = total > 0 ? totalScore / total : 0;

      res.json({
        tenant: {
          tenantId: tenant.tenantId,
          name: tenant.name,
        },
        summary: {
          totalSubmissions: total,
          passed,
          failed,
          inProgress,
          averageScore: avgScore,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
