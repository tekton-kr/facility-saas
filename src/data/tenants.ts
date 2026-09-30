export type TenantDef = {
  id: string
  slug: string
  name: string
  siteIds: string[]
}

export const TENANTS: TenantDef[] = [
  {
    id: 'tekton',
    slug: 'tekton',
    name: '텍톤',
    siteIds: ['hanam-hq', 'yongin-dc', 'suwon-off', 'hanam-plant'],
  },
]
