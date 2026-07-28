'use strict';

const prisma = require('../config/database');

/**
 * GET /api/profile
 * Returns the authenticated user's profile (creates one if missing).
 */
const getProfile = async (req, res, next) => {
  try {
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: req.user.id }
      });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/profile
 * Updates profile fields. All fields optional.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { weekContext, wakeTime, sleepTime, timezone, language, themePreference, workoutTime } = req.body;

    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      update: {
        ...(weekContext !== undefined && { weekContext }),
        ...(wakeTime !== undefined && { wakeTime }),
        ...(sleepTime !== undefined && { sleepTime }),
        ...(timezone !== undefined && { timezone }),
        ...(language !== undefined && { language }),
        ...(themePreference !== undefined && { themePreference }),
        ...(workoutTime !== undefined && { workoutTime }),
      },
      create: {
        userId: req.user.id,
        weekContext: weekContext || null,
        wakeTime: wakeTime || null,
        sleepTime: sleepTime || null,
        timezone: timezone || 'UTC',
        language: language || 'en',
        themePreference: themePreference || 'system',
      }
    });

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
