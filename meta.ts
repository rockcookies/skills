import type { RepositoryConfig } from './src/types'

/**
 * Repositories to clone and sync skills from
 */
export const repositories: Record<string, RepositoryConfig> = {
  'vueuse': {
    url: 'https://github.com/vueuse/skills',
    skillsPath: 'skills',
    skills: {
      'vueuse-functions': 'vueuse-functions',
    },
  },
  'tsdown': {
    url: 'https://github.com/rolldown/tsdown',
    skillsPath: 'skills',
    skills: {
      tsdown: 'tsdown',
    },
  },
  'vuejs-ai': {
    url: 'https://github.com/vuejs-ai/skills',
    skillsPath: 'skills',
    skills: {
      'vue-best-practices': 'vue-best-practices',
      'vue-router-best-practices': 'vue-router-best-practices',
      'vue-testing-best-practices': 'vue-testing-best-practices',
    },
  },
  'turborepo': {
    url: 'https://github.com/vercel/turborepo',
    skillsPath: '.claude/skills',
    skills: {
      turborepo: 'turborepo',
    },
  },
  'web-design-guidelines': {
    url: 'https://github.com/vercel-labs/agent-skills',
    skillsPath: 'skills',
    skills: {
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
}
