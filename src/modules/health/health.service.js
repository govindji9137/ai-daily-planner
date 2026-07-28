import { storage } from '../../core/storage/storage.provider';

class HealthService {
  async getTodayHealthPlan() {
    // In the future, this will fetch from GeoHealth API
    return {
      date: new Date().toISOString(),
      syncStatus: 'synced',
      completionPercentage: 60,
      healthStreakDays: 24,
      currentHealthFocus: 'Hydration Recovery',
      aiRecommendation: 'Poor sleep detected yesterday. Recommended reducing deep work duration today and skipping high-intensity workouts.',
      todayWorkout: { id: 'hw1', title: '30m Recovery Yoga', duration: 30, actualDuration: 0, status: 'pending', aiExplanation: 'Light activity recommended due to poor sleep.' },
      todayWater: { target: 8, current: 5 },
      todayMedicines: [
        { id: 'm1', title: 'Vitamin D', duration: 5, actualDuration: 5, time: 'Morning', status: 'completed', aiExplanation: 'Essential for bone health and immunity.' },
        { id: 'm2', title: 'Omega 3', duration: 5, actualDuration: 0, time: 'Evening', status: 'pending', aiExplanation: 'Supports brain and heart health.' }
      ],
      todaySleepGoal: '8 Hours (Target Bedtime: 10:30 PM)'
    };
  }
}

export const healthService = new HealthService();
