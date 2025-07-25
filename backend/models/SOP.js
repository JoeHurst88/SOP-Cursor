const mongoose = require('mongoose');

const sopSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  responsiblePerson: {
    type: String,
    required: true,
    trim: true
  },
  objective: {
    type: String,
    required: true
  },
  responsibility: {
    type: String,
    required: true
  },
  references: [{
    type: String,
    trim: true
  }],
  procedure: {
    type: String,
    required: true
  },
  steps: [{
    type: String,
    required: true,
    trim: true
  }],
  effectiveDate: {
    type: Date,
    required: true
  },
  revisionDate: {
    type: Date,
    required: true
  },
  revisionNumber: {
    type: String,
    required: true,
    default: '1.0',
    trim: true
  },
  pdfConfig: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SOP = mongoose.model('SOP', sopSchema);

module.exports = SOP; 