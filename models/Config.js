const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Default configuration
configSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      key: 'site_name',
      value: 'Regional Admin System',
      description: 'Site name displayed in emails and UI'
    },
    {
      key: 'invitation_expiry_days',
      value: 7,
      description: 'Number of days before invitation expires'
    },
    {
      key: 'max_content_per_region',
      value: 100,
      description: 'Maximum content items per region'
    }
  ];

  for (const config of defaults) {
    await this.findOneAndUpdate(
      { key: config.key },
      config,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Config', configSchema);