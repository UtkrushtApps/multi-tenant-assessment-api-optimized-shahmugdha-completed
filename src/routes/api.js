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
        query.status = statusFilter;
      }

      const skip = (page - 1) * limit;

      const filteredSubmissions = await Submission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const assessmentIds = [...new Set(filteredSubmissions.map((s) => s.assessmentId.toString()))];
      const assessments = await Assessment.find({ _id: { $in: assessmentIds } }).lean();
      const assessmentMap = new Map(assessments.map((a) => [a._id.toString(), a]));

      const detailedSubmissions = filteredSubmissions.map((sub) => {
        const assessment = assessmentMap.get(sub.assessmentId.toString());
        return {
          ...sub,
          assessmentTitle: assessment ? assessment.title : null,
          assessmentCategory: assessment ? assessment.category : null,
        };
      });

      const totalCount = await Submission.countDocuments(query);

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

      const [summary] = await Submission.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            passed: { $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
            totalScore: { $sum: '$score' },
          },
        },
      ]);

      const total = summary ? summary.total : 0;
      const passed = summary ? summary.passed : 0;
      const failed = summary ? summary.failed : 0;
      const inProgress = summary ? summary.inProgress : 0;
      const avgScore = total > 0 ? summary.totalScore / total : 0;

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
          averageScore: parseFloat(avgScore.toFixed(2)),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
