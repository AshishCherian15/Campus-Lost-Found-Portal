export type User = {
  id: string;
  username: string;
  email: string;
  name: string;
  contact: string;
  department: string;
  role: 'student' | 'admin';
};

export type Item = {
  id: string;
  type: 'lost' | 'found';
  name: string;
  description: string;
  location: string;
  category: string;
  imageUrl: string;
  status: 'open' | 'claimed' | 'resolved';
  reportedBy: string;
  reports: number;
  createdAt: string;
  reporterName?: string; // Enriched
};

export type Claim = {
  id: string;
  itemId: string;
  requesterId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  createdAt: string;
  item?: Item; // Enriched
  requester?: User; // Enriched
};
