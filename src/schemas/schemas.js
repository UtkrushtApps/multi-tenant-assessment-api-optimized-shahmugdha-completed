const Joi = require('joi');

// Validation schema for tenantId param (simple but explicit)
function validateTenantIdQuery(req) {
  const schema = Joi.object({
    tenantId: Joi.string().min(1).max(100).required(),
  });

  return schema.validate({ tenantId: req.params.tenantId }, { abortEarly: false });
}

// Validation schema for pagination query
function validatePaginationQuery(req) {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(20),
    status: Joi.string().valid('passed', 'failed', 'in-progress').optional(),
  });

  const query = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    status: req.query.status,
  };

  return schema.validate(query, { abortEarly: false });
}

module.exports = {
  validateTenantIdQuery,
  validatePaginationQuery,
};
