import type { CateringOption } from '@/types';

export const mockCatering: CateringOption[] = [
  {
    id: 'catering-001',
    name: '精选美式咖啡',
    type: 'coffee',
    pricePerPerson: 18,
    preparationTime: 10,
    description: '采用阿拉比卡豆现磨制作，口感醇厚，提神醒脑',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
  },
  {
    id: 'catering-002',
    name: '拿铁玛奇朵',
    type: 'coffee',
    pricePerPerson: 25,
    preparationTime: 15,
    description: '浓缩咖啡与丝滑牛奶的经典融合，奶泡绵密细腻',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400',
  },
  {
    id: 'catering-003',
    name: '龙井绿茶',
    type: 'tea',
    pricePerPerson: 12,
    preparationTime: 8,
    description: '西湖龙井明前特级，汤色清亮，香气清雅持久',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca7dcfc75?w=400',
  },
  {
    id: 'catering-004',
    name: '伯爵红茶',
    type: 'tea',
    pricePerPerson: 15,
    preparationTime: 8,
    description: '佛手柑油香气独特，英式经典下午茶首选',
    image: 'https://images.unsplash.com/photo-1597318375661-f25bcb79013a?w=400',
  },
  {
    id: 'catering-005',
    name: '西式点心拼盘',
    type: 'snacks',
    pricePerPerson: 35,
    preparationTime: 30,
    description: '精选曲奇、马卡龙、慕斯蛋糕等多款精致甜点组合',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
  },
  {
    id: 'catering-006',
    name: '中式商务套餐',
    type: 'lunch',
    pricePerPerson: 58,
    preparationTime: 45,
    description: '一荤两素一汤营养搭配，配精美水果与米饭',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
  },
  {
    id: 'catering-007',
    name: '时令水果拼盘',
    type: 'fruit',
    pricePerPerson: 22,
    preparationTime: 20,
    description: '当季新鲜水果精选切配，维生素丰富健康美味',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400',
  },
  {
    id: 'catering-008',
    name: '精致下午茶套餐',
    type: 'snacks',
    pricePerPerson: 48,
    preparationTime: 35,
    description: '三层英式下午茶架，咸点甜点搭配精选茶饮',
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400',
  },
];

export const cateringOptions = mockCatering;
export const defaultCatering = mockCatering;

export const getCateringById = (id: string): CateringOption | undefined => {
  return mockCatering.find((c) => c.id === id);
};

export const getCateringByType = (type: CateringOption['type']): CateringOption[] => {
  return mockCatering.filter((c) => c.type === type);
};

export const getCateringByIds = (ids: string[]): CateringOption[] => {
  return mockCatering.filter((c) => ids.includes(c.id));
};
