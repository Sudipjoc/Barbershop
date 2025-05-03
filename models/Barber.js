const mongoose = require("mongoose");

// Employee Schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String, required: true }, // URL or local path
  job: { type: String, required: true }
});

// Service Schema (embedded inside Barber)
const serviceSchema = new mongoose.Schema({
  type: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }
});

// Barber Schema
const barberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: true },
  role: { type: String, default: "barber" },
  shopStatus: { type: String, enum: ["open", "closed"], default: "closed" },
  availabilityStatus: { type: String, enum: ["Available", "Busy"], default: "Available" },
  appointmentsCount: { type: Number, default: 0 },
  services: [serviceSchema],  
  employees: [employeeSchema] 
}, { timestamps: true });

module.exports = mongoose.model('Barber', barberSchema);
