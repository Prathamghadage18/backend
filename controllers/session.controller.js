import Session from "../models/Session.js";
import { notFoundError } from "../utils/helpers.js";

// Get consultant sessions (categorized)

export const getConsultantSessions = async (req, res, next) => {
  try {
    const consultantId = req.user.consultantProfile || req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // start of next day

    // ✅ Fetch sessions with proper date type
    const sessions = await Session.find({ consultant: consultantId })
      .populate("customer", "name email designation company")
      .populate("consultant", "name email")
      .populate({
        path: "query",
        select: "querySub queryText files status sessionDateTime",
      })
      .populate("followUpSessions")
      .sort({ date: 1 });

    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        today: [],
        upcoming: [],
        missed: [],
        totals: { today: 0, upcoming: 0, missed: 0, overall: 0 },
      });
    }

    // ✅ Categorize by Session.date
    const todaySessions = sessions.filter(
      (s) => s.date >= today && s.date < tomorrow
    );

    const upcomingSessions = sessions.filter((s) => s.date >= tomorrow);

    const missedSessions = sessions.filter((s) => s.date < today);

    res.json({
      success: true,
      today: todaySessions,
      upcoming: upcomingSessions,
      missed: missedSessions,
      totals: {
        today: todaySessions.length,
        upcoming: upcomingSessions.length,
        missed: missedSessions.length,
        overall: sessions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Get session details (only if belongs to logged-in consultant AND query is accepted)
export const getSessionDetails = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      consultant: req.user.consultantProfile || req.user._id,
    })
      .populate("customer", "name email designation company")
      .populate({
        path: "query",
        match: { status: "accepted" }, // only accepted queries
        select: "querySub queryText files status",
        populate: {
          path: "user",
          select: "name",
        },
      })
      .populate("followUpSessions");

    if (!session || !session.query) {
      return notFoundError("Session not found or query not accepted", res);
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// Create follow-up session
export const createFollowUpSession = async (req, res, next) => {
  try {
    const { parentSessionId, date, duration, type, fee } = req.body;

    const parentSession = await Session.findById(parentSessionId);
    if (!parentSession) {
      return notFoundError("Parent session not found", res);
    }

    const followUpSession = new Session({
      consultant: parentSession.consultant,
      customer: parentSession.customer,
      date,
      duration,
      type,
      fee,
      status: "scheduled",
      parentSession: parentSessionId,
    });

    await followUpSession.save();

    parentSession.followUpSessions.push(followUpSession._id);
    await parentSession.save();

    res.status(201).json({
      success: true,
      data: followUpSession,
    });
  } catch (error) {
    next(error);
  }
};

// Add session documents
export const addSessionDocument = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return notFoundError("Session not found", res);
    }

    if (req.file) {
      session.documents.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
      });
      await session.save();
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};