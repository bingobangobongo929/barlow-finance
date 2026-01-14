import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "data_export"
  | "bulk_import"
  | "bulk_delete"
  | "settings_change"
  | "loan_create"
  | "loan_update"
  | "loan_delete"
  | "budget_create"
  | "budget_update"
  | "budget_delete"
  | "category_create"
  | "category_update"
  | "category_delete"
  | "rule_create"
  | "rule_update"
  | "rule_delete"
  | "invite_create"
  | "invite_accept"
  | "member_remove"
  | "account_create"
  | "account_update"
  | "account_delete"
  | "project_create"
  | "project_update"
  | "project_delete"
  | "vehicle_create"
  | "vehicle_update"
  | "vehicle_delete";

export type AuditEntityType =
  | "user"
  | "household"
  | "account"
  | "transaction"
  | "category"
  | "rule"
  | "budget"
  | "loan"
  | "project"
  | "vehicle"
  | "upcoming_expense"
  | "invite";

export interface AuditLogParams {
  householdId: string | null;
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const headersList = await headers();

    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      null;

    const userAgent = headersList.get("user-agent") || null;

    await supabase.from("audit_logs").insert({
      household_id: params.householdId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main operation
    console.error("Failed to create audit log:", error instanceof Error ? error.message : "Unknown error");
  }
}

export async function getAuditLogs(
  householdId: string,
  options: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    entityType?: AuditEntityType;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  const supabase = await createServiceClient();

  let query = supabase
    .from("audit_logs")
    .select(
      `
      *,
      user:profiles(id, display_name, email)
    `
    )
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (options.action) {
    query = query.eq("action", options.action);
  }

  if (options.entityType) {
    query = query.eq("entity_type", options.entityType);
  }

  if (options.startDate) {
    query = query.gte("created_at", options.startDate);
  }

  if (options.endDate) {
    query = query.lte("created_at", options.endDate);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data, count };
}
