const mongoose = require('mongoose');

// Tenant schema: represents a customer using the platform
const TenantSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    plan: { type: String, required: true },
  },
  { timestamps: true }
);

// Assessment schema: each tenant can create multiple assessments
const AssessmentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
  },
  { timestamps: true }
);

// Submission schema: candidates submit responses to assessments
const SubmissionSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    userId: { type: String, required: true },
    status: { type: String, enum: ['passed', 'failed', 'in-progress'], required: true },
    score: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    // Simulate heavier documents: store answer payloads as an array
    answers: {
      type: [
        new mongoose.Schema(
          {
            questionId: String,
            selectedOption: String,
            correct: Boolean,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: false }
);

// Note: indexes are intentionally minimal here to keep schema definition straightforward.
// The application logic may rely heavily on certain fields for filtering/sorting.

const Tenant = mongoose.model('Tenant', TenantSchema);
const Assessment = mongoose.model('Assessment', AssessmentSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);

module.exports = {
  Tenant,
  Assessment,
  Submission,
};
