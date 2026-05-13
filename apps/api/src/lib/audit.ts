import { db } from "../db/client.js";
import { auditLog } from "../db/schema.js";

/**
 * Append-only audit logging. Never throws to the caller — auditing must not
 * block the user's action; failures get logged to console.
 */
export async function audit(args: {
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: args.userId,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      payload: args.payload ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write entry", err, args);
  }
}
