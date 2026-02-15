const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to initialize 16 regions
regionSchema.statics.initializeRegions = async function() {
  const regions = [
    { name: 'Tigray', code: 'TIG' },
    { name: 'Afar', code: 'AFA' },
    { name: 'Amhara', code: 'AMH' },
    { name: 'Oromia', code: 'ORO' },
    { name: 'Somali', code: 'SOM' },
    { name: 'Benishangul-Gumuz', code: 'BEN' },
    { name: 'Southern Nations', code: 'SNN' },
    { name: 'Gambela', code: 'GAM' },
    { name: 'Harari', code: 'HAR' },
    { name: 'Sidama', code: 'SID' },
    { name: 'South West', code: 'SWE' },
    { name: 'Central Ethiopia', code: 'CEN' },
    { name: 'Addis Ababa', code: 'ADD' },
    { name: 'Dire Dawa', code: 'DIR' },
    { name: 'Region 15', code: 'R15' },
    { name: 'Region 16', code: 'R16' }
  ];

  for (const region of regions) {
    await this.findOneAndUpdate(
      { code: region.code },
      region,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Region', regionSchema);