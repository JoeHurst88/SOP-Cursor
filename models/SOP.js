const mongoose = require('mongoose');

const SOPSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  steps: [{ type: String, required: true }],
  responsiblePerson: { type: String, required: true },
  date: { type: Date, required: true },
  procedure: { type: String }, // Overview of the procedure
  references: [{ type: String }], // References array
  revisionNumber: { type: String, default: '1.0' }, // Revision number
  effectiveDate: { type: Date }, // Effective date
  revisionDate: { type: Date }, // Revision date
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SOP', SOPSchema); 