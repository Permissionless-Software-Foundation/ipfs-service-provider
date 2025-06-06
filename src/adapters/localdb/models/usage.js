/*
  Usage data model
*/

// Global npm libraries
import mongoose from 'mongoose'

const Usage = new mongoose.Schema({
  ip: { type: String },
  url: { type: String },
  method: { type: String },
  timestamp: { type: Date }
})

export default mongoose.model('usage', Usage)
