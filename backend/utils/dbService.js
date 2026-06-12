import mongoose from 'mongoose';

/**
 * Database Service Layer
 *
 * Provides reusable database operations abstracting Mongoose details.
 * Controllers call these methods instead of interacting with models directly.
 */

class DatabaseService {
  /**
   * Create a single document
   */
  static async create(Model, data) {
    const doc = await Model.create(data);
    return doc;
  }

  /**
   * Find a single document by ID
   */
  static async findById(Model, id, populateFields = '') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid document ID');
    }
    const query = Model.findById(id);
    if (populateFields) query.populate(populateFields);
    return query.exec();
  }

  /**
   * Find multiple documents with optional filters, sorting, pagination
   */
  static async findMany(Model, filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      page = 1,
      limit = 20,
      populate = '',
      select = '',
    } = options;

    const skip = (page - 1) * limit;

    const query = Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (populate) query.populate(populate);
    if (select) query.select(select);

    const [docs, total] = await Promise.all([
      query.exec(),
      Model.countDocuments(filter),
    ]);

    return { docs, total, page, limit };
  }

  /**
   * Update a document by ID
   */
  static async updateById(Model, id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid document ID');
    }
    const doc = await Model.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return doc;
  }

  /**
   * Delete a document by ID
   */
  static async deleteById(Model, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid document ID');
    }
    const doc = await Model.findByIdAndDelete(id);
    return doc;
  }

  /**
   * Count documents matching a filter
   */
  static async count(Model, filter = {}) {
    return Model.countDocuments(filter);
  }

  /**
   * Aggregate pipeline execution
   */
  static async aggregate(Model, pipeline) {
    return Model.aggregate(pipeline);
  }

  /**
   * Check if database connection is healthy
   */
  static getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    const state = mongoose.connection.readyState;
    return {
      status: states[state] || 'unknown',
      stateCode: state,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    };
  }
}

export default DatabaseService;
