import { Specialty } from './specialty.model';
import { Symptom } from './symptom.model';

export interface Disease {
  id?: number;
  name: string;
  description?: string;
  causes?: string;
  treatment?: string;
  specialtyName?: string;  // temporaire : backend renvoie string
  symptoms?: string[];     // temporaire : backend renvoie array de strings
}

export interface DiseaseDTO {
  id?: number;
  name: string;
  description?: string;
  causes?: string;
  treatment?: string;
  specialtyId?: number;
  symptomIds?: number[];
}