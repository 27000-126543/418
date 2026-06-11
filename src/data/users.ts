import type { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: '张振华',
    email: 'zhangzhenhua@company.com',
    phone: '138-0000-0001',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20business%20executive%20portrait%20formal%20suit&image_size=square',
    role: 'admin',
    department: '总裁办',
    position: '公司总裁',
    level: 'executive',
  },
  {
    id: 'user-002',
    name: '李明华',
    email: 'liminghua@company.com',
    phone: '138-0000-0002',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20CTO%20portrait%20business%20formal&image_size=square',
    role: 'admin',
    department: '技术部',
    position: '首席技术官',
    level: 'executive',
  },
  {
    id: 'user-003',
    name: '王建国',
    email: 'wangjianguo@company.com',
    phone: '138-0000-0003',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20product%20manager%20portrait%20casual%20business&image_size=square',
    role: 'host',
    department: '产品部',
    position: '产品总监',
    level: 'senior',
  },
  {
    id: 'user-004',
    name: '赵晓婷',
    email: 'zhaoxiaoting@company.com',
    phone: '138-0000-0004',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20marketing%20director%20portrait%20elegant%20business&image_size=square',
    role: 'host',
    department: '市场部',
    position: '市场总监',
    level: 'senior',
  },
  {
    id: 'user-005',
    name: '陈思远',
    email: 'chensiyuan@company.com',
    phone: '138-0000-0005',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20senior%20engineer%20portrait%20tech%20casual&image_size=square',
    role: 'host',
    department: '财务部',
    position: '财务高级经理',
    level: 'senior',
  },
  {
    id: 'user-006',
    name: '刘雅芳',
    email: 'liuyafang@company.com',
    phone: '138-0000-0006',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20hr%20manager%20portrait%20friendly%20business&image_size=square',
    role: 'host',
    department: '人力资源部',
    position: 'HR高级经理',
    level: 'senior',
  },
  {
    id: 'user-007',
    name: '周伟强',
    email: 'zhouweiqiang@company.com',
    phone: '138-0000-0007',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20male%20sales%20manager%20portrait%20confident%20suit&image_size=square',
    role: 'host',
    department: '技术部',
    position: '高级架构师',
    level: 'senior',
  },
  {
    id: 'user-008',
    name: '孙美玲',
    email: 'sunmeiling@company.com',
    phone: '138-0000-0008',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20asian%20female%20finance%20analyst%20portrait%20business%20attire&image_size=square',
    role: 'attendee',
    department: '行政部',
    position: '行政专员',
    level: 'staff',
  },
];

export const defaultUsers = mockUsers;
export const users = mockUsers;

export const getUserById = (id: string): User | undefined => {
  return users.find((u) => u.id === id);
};

export const getUsersByRole = (role: User['role']): User[] => {
  return users.filter((u) => u.role === role);
};

export const getUsersByDepartment = (department: string): User[] => {
  return users.filter((u) => u.department === department);
};
