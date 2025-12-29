const Object = require("../models/Object");
const mongoose = require("mongoose");

// Get all objects (list)
exports.getObjects = async (req, res) => {
  try {
    const { page, limit, search, status, type } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
        { "contactPerson.name": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    // If pagination parameters are provided, use pagination
    if (page && limit) {
      const objects = await Object.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Object.countDocuments(query);

      res.json({
        objects,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } else {
      // Return all objects without pagination (for frontend compatibility)
      const objects = await Object.find(query).sort({ createdAt: -1 });
      res.json(objects);
    }
  } catch (error) {
    console.error("Error fetching objects:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single object (details)
exports.getObject = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid object ID format" });
    }

    const object = await Object.findById(req.params.id);
    if (!object) {
      return res.status(404).json({ message: "Object not found" });
    }
    res.json(object);
  } catch (error) {
    console.error("Error fetching object:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create new object
exports.createObject = async (req, res) => {
  try {
    // Removed for production environment

    const object = new Object(req.body);
    const newObject = await object.save();

    console.log(
      "✅ Object created successfully:",
      newObject.name,
      "ID:",
      newObject._id
    );
    res.status(201).json(newObject);
  } catch (error) {
    console.error("❌ Error creating object:", error);
    console.error("🔍 Validation errors:", error.errors);
    res.status(400).json({
      message: error.message,
      errors: error.errors,
    });
  }
};

// Update object
exports.updateObject = async (req, res) => {
  try {
    console.log("🔄 Updating object ID:", req.params.id);
    console.log("📥 Update data:", req.body);

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid object ID format" });
    }

    const object = await Object.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!object) {
      console.log("❌ Object not found:", req.params.id);
      return res.status(404).json({ message: "Object not found" });
    }

    console.log("✅ Object updated successfully:", object.name);
    res.json(object);
  } catch (error) {
    console.error("❌ Error updating object:", error);
    console.error("🔍 Validation errors:", error.errors);
    res.status(400).json({
      message: error.message,
      errors: error.errors,
    });
  }
};

// Delete object
exports.deleteObject = async (req, res) => {
  try {
    console.log("🗑️ Deleting object ID:", req.params.id);

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid object ID format" });
    }

    const object = await Object.findByIdAndDelete(req.params.id);
    if (!object) {
      console.log("❌ Object not found:", req.params.id);
      return res.status(404).json({ message: "Object not found" });
    }

    console.log("✅ Object deleted successfully:", object.name);
    res.json({ message: "Object deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting object:", error);
    res.status(500).json({ message: error.message });
  }
};
