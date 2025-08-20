import Query from "../models/Query.js";
import Consultant from "../models/Consultant.js";
import Session from "../models/Session.js";
import { notFoundError } from "../utils/helpers.js";

// Get consultant queries with pagination and status filtering
export const getConsultantQueries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, consultantId } = req.query;

    const filter = {};
    if (consultantId) filter.consultant = consultantId;
    if (status && status !== "all") filter.status = status;

    const startIndex = (page - 1) * limit;
    const total = await Query.countDocuments(filter);

    const queries = await Query.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(parseInt(limit));

    res.json({
      success: true,
      queries,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalQueries: total,
    });
  } catch (error) {
    next(error);
  }
};

// Create query with WebSocket notification
export const createQuery = async (req, res, next) => {
  try {
    const { consultantId, querySub, queryText, sessionDateTime, duration, sessionLink } = req.body;
    const userId = req.user._id;

    const consultant = await Consultant.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found",
      });
    }

    const files = [];
    if (req.files?.length) {
      for (const file of req.files) {
        files.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
        });
      }
    }

    const query = await Query.create({
      user: userId,
      consultant: consultantId,
      querySub,
      queryText,
      sessionDateTime,
      duration,
      sessionLink,
      files,
      fee: consultant.expectedFee,
    });

    const io = req.app.get("socketio");
    io.to(`consultant_${consultantId}`).emit("new-query", query);

    res.status(201).json({
      success: true,
      message: "Query submitted successfully",
      data: {
        queryId: query._id,
        paymentRequired: true,
        amount: consultant.expectedFee,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Update query status with WebSocket notification
export const updateQueryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, date, duration, type } = req.body;

    const query = await Query.findById(id).populate("consultant", "expectedFee");

    if (!query) {
      return notFoundError("Query not found", res);
    }

    query.status = status;

    if (status === "accepted") {
      const session = new Session({
        consultant: query.consultant._id,
        customer: query.user,
        date: new Date(date), // ✅ ensure Date object
        duration,
        type,
        fee: query.consultant.expectedFee,
        status: "scheduled",
        query: query._id,
      });

      await session.save();
      query.session = session._id;
      query.sessionDateTime = new Date(date); // ✅ also store in Query
    }

    const updatedQuery = await query.save();

    // Emit status update to consultant's room
    const io = req.app.get("socketio");
    io.to(`consultant_${query.consultant._id}`).emit("update-query", updatedQuery);

    res.json({
      success: true,
      data: updatedQuery,
    });
  } catch (error) {
    next(error);
  }
};

// Get single query by ID
export const getQueryById = async (req, res, next) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate("user", "name email")
      .populate("consultant", "expectedFee");

    if (!query) {
      return notFoundError("Query not found", res);
    }

    res.json({
      success: true,
      data: query,
    });
  } catch (error) {
    next(error);
  }
};
