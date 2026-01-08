
import { Category, Email, Account } from './types';

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc_1', email: 'work@reception.ai', name: 'Work Inbox', provider: 'outlook', color: 'bg-blue-600', initials: 'W' },
  { id: 'acc_2', email: 'personal@gmail.com', name: 'Personal', provider: 'gmail', color: 'bg-red-500', initials: 'P' },
  { id: 'acc_3', email: 'startup@proton.me', name: 'Stealth Startup', provider: 'custom', color: 'bg-purple-600', initials: 'S' }
];

export const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    accountId: 'acc_1',
    senderName: 'Sarah Jenkins',
    senderEmail: 'sarah.j@techcorp.com',
    subject: 'Project Reception Launch Schedule',
    body: "Hi team, I've attached the final timeline for the Project Reception launch. We need to review the backend integration by Thursday. Let me know if you have any blockers.",
    timestamp: '10:30 AM',
    isRead: false,
    category: Category.INBOX,
  },
  {
    id: '2',
    accountId: 'acc_2',
    senderName: 'Cloud Services',
    senderEmail: 'no-reply@cloudhost.com',
    subject: 'Monthly Billing Statement - October',
    body: 'Your monthly statement for account #4920 is now available. Your total for this period is $152.40. Click here to download the PDF receipt.',
    timestamp: 'Yesterday',
    isRead: true,
    category: Category.INBOX,
    isMailingList: true
  },
  {
    id: '3',
    accountId: 'acc_1',
    senderName: 'Win Free Prizes!',
    senderEmail: 'support@mega-rewards-win.net',
    subject: 'URGENT: Your reward is waiting!',
    body: 'Congratulations! You have been selected to win a new iPhone 15. Just click the link below and provide your credit card for shipping.',
    timestamp: 'Oct 22',
    isRead: true,
    category: Category.SPAM,
    isSpam: true
  },
  {
    id: '4',
    accountId: 'acc_2',
    senderName: 'Medium Daily',
    senderEmail: 'noreply@medium.com',
    subject: '10 React tips you need to know',
    body: 'Discover the latest stories from top writers on Medium. "Mastering the UseEffect Hook" by Dan Abramov is trending now.',
    timestamp: 'Oct 21',
    isRead: false,
    category: Category.PROMOTIONS,
    isMailingList: true
  },
  {
    id: '5',
    accountId: 'acc_3',
    senderName: 'Travel Alerts',
    senderEmail: 'alerts@worldtraveler.com',
    subject: 'Flight BA202: Gate Change Notice',
    body: 'Attention: Your flight BA202 from London to New York has had a gate change. Please proceed to Gate B42.',
    timestamp: 'Oct 20',
    isRead: true,
    category: Category.INBOX,
  }
];
