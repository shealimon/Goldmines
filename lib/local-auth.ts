import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  api_credits: number;
  plan_type: string;
  credits_used_today: number;
  last_credit_reset: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessIdea {
  id: string;
  reddit_post_id: string;
  reddit_title: string;
  reddit_content: string;
  reddit_author: string;
  reddit_subreddit: string;
  reddit_score: number;
  reddit_comments: number;
  reddit_url: string;
  reddit_permalink: string;
  reddit_created_utc: number;
  business_idea_name: string;
  opportunity_points: string[];
  problems_solved: string[];
  target_customers: string[];
  market_size: string[];
  niche: string;
  category: string;
  marketing_strategy: string[];
  analysis_status: string;
  full_analysis: string;
  created_at: string;
}

// In-memory storage (replace with a real database in production)
let users: User[] = [];
let profiles: UserProfile[] = [];
let businessIdeas: BusinessIdea[] = [];
let redditPosts: any[] = [];

// Helper functions
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

// User management
export const createUser = async (email: string, password: string): Promise<User> => {
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);
  const user: User = {
    id: generateId(),
    email,
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  };

  users.push(user);
  
  // Create default profile
  const profile: UserProfile = {
    user_id: user.id,
    name: null,
    avatar_url: null,
    api_credits: 1000,
    plan_type: 'free',
    credits_used_today: 0,
    last_credit_reset: new Date().toISOString().split('T')[0],
    subscription_status: null,
    subscription_plan: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  profiles.push(profile);
  return user;
};

export const findUserByEmail = (email: string): User | null => {
  return users.find(u => u.email === email) || null;
};

export const findUserById = (id: string): User | null => {
  return users.find(u => u.id === id) || null;
};

// Profile management
export const findProfileByUserId = (userId: string): UserProfile | null => {
  return profiles.find(p => p.user_id === userId) || null;
};

export const updateProfile = (userId: string, updates: Partial<UserProfile>): UserProfile | null => {
  const profileIndex = profiles.findIndex(p => p.user_id === userId);
  if (profileIndex === -1) return null;

  profiles[profileIndex] = {
    ...profiles[profileIndex],
    ...updates,
    updated_at: new Date().toISOString()
  };

  return profiles[profileIndex];
};

// Business Ideas management
export const createBusinessIdea = (data: Omit<BusinessIdea, 'id' | 'created_at'>): BusinessIdea => {
  const businessIdea: BusinessIdea = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString()
  };

  businessIdeas.push(businessIdea);
  return businessIdea;
};

export const findBusinessIdeas = (): BusinessIdea[] => {
  return businessIdeas.filter(bi => bi.analysis_status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const findBusinessIdeaByRedditPostId = (redditPostId: string): BusinessIdea | null => {
  return businessIdeas.find(bi => bi.reddit_post_id === redditPostId) || null;
};

// Reddit Posts management
export const createRedditPost = (post: any): any => {
  const existingPost = redditPosts.find(p => p.reddit_post_id === post.reddit_post_id);
  if (existingPost) return existingPost;

  const newPost = {
    ...post,
    id: generateId(),
    created_at: new Date().toISOString()
  };

  redditPosts.push(newPost);
  return newPost;
};

export const findRedditPostsByIds = (ids: string[]): any[] => {
  return redditPosts.filter(p => ids.includes(p.reddit_post_id));
};

// Utility function to generate IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Initialize with a demo user for testing
export const initializeWithDemoData = () => {
  if (users.length === 0) {
    // Create demo user
    createUser('demo@goldmines.com', 'demo123').catch(console.error);
  }
};
