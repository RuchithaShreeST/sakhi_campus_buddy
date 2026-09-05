export type NotificationCategory = 'Sakhi' | 'Campus' | 'Club' | 'Event' | 'Placement' | 'Study' | 'Message' | 'Connection' | 'Circle' | 'Wellness' | 'Achievement' | 'campus' | 'circle' | 'event' | 'placement' | 'wellness';
export type SakhiNotification = { id: string; category: NotificationCategory; title: string; body: string; createdAt: string; read: boolean; actionPath?: string; actionUrl?: string };


