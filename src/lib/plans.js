// Mirrors app/config.py PLAN_PRICES and PLAN_LIMITS on the backend.
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Instant Chat, no account needed',
    monthlyEtb: 0,
    annualEtb: 0,
    featured: false,
    features: [
      'Instant Chat sessions (1 file, 5MB)',
      '100,000 tokens / month',
      '2-hour session TTL',
      'Amharic, Oromifaa & 100+ languages',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing teams & products',
    monthlyEtb: 1100,
    annualEtb: 11000,
    featured: true,
    features: [
      'Up to 3 hosted chatbots',
      'Up to 5 API projects',
      'Up to 3 GitHub repos',
      '20 documents per project · 50MB files',
      '5,000,000 tokens / month',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom quota & SLA',
    monthlyEtb: 4500,
    annualEtb: 45000,
    featured: false,
    features: [
      'Unlimited bots, projects & repos',
      'Unlimited documents per project',
      '500MB file uploads',
      '50,000,000 tokens / month',
      'Priority support & SLA',
    ],
  },
];

export const PLAN_LIMITS = {
  free: { hosted_bots: 0, api_projects: 0, github_repos: 0, docs_per_project: 1, file_size_mb: 5, monthly_tokens: 100000 },
  pro: { hosted_bots: 3, api_projects: 5, github_repos: 3, docs_per_project: 20, file_size_mb: 50, monthly_tokens: 5000000 },
  enterprise: { hosted_bots: Infinity, api_projects: Infinity, github_repos: Infinity, docs_per_project: Infinity, file_size_mb: 500, monthly_tokens: 50000000 },
};
