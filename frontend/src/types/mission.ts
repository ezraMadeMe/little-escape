export interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  condition?: string;
  imageUrl?: string;
  locationType?: 'INDOOR' | 'OUTDOOR' | 'ANY';
  timeOfDay?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ANY';
  createdAt?: string;
  updatedAt?: string;
}
