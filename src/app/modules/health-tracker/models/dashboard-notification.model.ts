export type DashboardNotificationTone = 'warning' | 'doctor' | 'tip';

export interface DoctorRecommendation {
  doctor: string;
  speciality: string;
}

export interface RecommendationStore {
  activitiesRecommendations: string[];
  wellnessTips: string[];
  doctorsRecommendations: DoctorRecommendation[];
}

export interface DashboardNotificationItem {
  id: string;
  title: string;
  description: string;
  tone: DashboardNotificationTone;
  badge: string;
  entries: string[];
  dismissible: boolean;
}

export interface MoodSleepAnalysisResult {
  badStreak: number;
  notifications: DashboardNotificationItem[];
  store: RecommendationStore;
}