export type NutritionCalorieBand = 'low' | 'medium' | 'high';

export interface NutritionAnalysis {
  id?: number;
  foodName: string;
  calories: number;
  confidence: number;
  analyzedAt: string;
  imageName: string;
  calorieBand: NutritionCalorieBand;
}