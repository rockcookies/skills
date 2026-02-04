import type { RepositoryConfig } from './src/types'

/**
 * Repositories to clone and sync skills from
 *
 * Version locking options (priority: commit > tag > branch):
 * - branch: Lock to a specific branch (e.g., 'main', 'develop')
 * - tag: Lock to a specific tag (e.g., 'v1.0.0')
 * - commit: Lock to a specific commit SHA
 * - If none specified, uses the default branch
 */
export const repositories: Record<string, RepositoryConfig> = {
  'vueuse': {
    url: 'https://github.com/vueuse/skills',
    skillsPath: 'skills',
    // branch: 'main', // Optional: lock to specific branch
    // tag: 'v1.0.0', // Optional: lock to specific tag
    // commit: 'abc123', // Optional: lock to specific commit
    skills: {
      'vueuse-functions': 'vueuse-functions',
    },
  },
  'tsdown': {
    url: 'https://github.com/rolldown/tsdown',
    skills: {
      tsdown: 'tsdown',
    },
  },
  'vuejs-ai': {
    url: 'https://github.com/vuejs-ai/skills',
    skills: {
      'vue-best-practices': 'vue-best-practices',
      'vue-router-best-practices': 'vue-router-best-practices',
      'vue-testing-best-practices': 'vue-testing-best-practices',
    },
  },
  'turborepo': {
    url: 'https://github.com/vercel/turborepo',
    skills: {
      turborepo: 'turborepo',
    },
  },
  'vercel-skills': {
    url: 'https://github.com/vercel-labs/agent-skills',
    skills: {
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
  'anthropics-skills': {
    url: 'https://github.com/anthropics/skills',
    skills: {
      'frontend-design': 'frontend-design',
      'skill-creator': 'skill-creator',
    },
  },
  'antfu-skills': {
    url: 'https://github.com/antfu/skills',
  },
}
