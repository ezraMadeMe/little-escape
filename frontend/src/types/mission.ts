export interface Mission {
  id: number;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  condition?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
