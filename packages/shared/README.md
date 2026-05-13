# @glosspilot/shared

Zod schemas + TypeScript types shared between API and web.

**Status:** stub. Schemas land alongside v0.2.0 auth.

Planned exports:

```ts
// users
export const userSchema, loginSchema, createUserSchema
// sites
export const siteSchema, createSiteSchema, updateSiteSchema
// events, reports, materials, tasks ...
// roles
export const Role: { ADMIN: 'ADMIN', WORKER: 'WORKER' }
```

Pattern: define once with zod, infer TS types via `z.infer<typeof X>`, use the same schema for Fastify request validation AND react-hook-form validation.
