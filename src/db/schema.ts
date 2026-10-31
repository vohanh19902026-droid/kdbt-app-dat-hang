import {
  boolean, decimal, index, pgEnum, pgSequence, pgTable, text, timestamp,
  uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", ["ADMIN", "PLANNER", "SALES", "ACCOUNTANT"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const bookingNumberSeq = pgSequence("booking_number_seq", { startWith: 7431 });

// Better Auth tables; appRole is separate from its internal account-management role.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  appRole: appRoleEnum("app_role").default("SALES").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (t) => [index("session_user_id_idx").on(t.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("account_user_id_idx").on(t.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  defaultAddress: text("default_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (t) => [index("customers_name_idx").on(t.name)]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingNo: text("booking_no").notNull().default(sql`'BOOK-' || nextval('booking_number_seq')::text`),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  salesRepName: text("sales_rep_name").notNull(),
  siteAddress: text("site_address").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  plannedStartAt: timestamp("planned_start_at", { withTimezone: true }),
  plannedEndAt: timestamp("planned_end_at", { withTimezone: true }),
  quantityM3: decimal("quantity_m3", { precision: 10, scale: 2 }).notNull(),
  actualM3: decimal("actual_m3", { precision: 10, scale: 2 }).default("0").notNull(),
  grade: text("grade").notNull(),
  sandType: text("sand_type").notNull(),
  stoneType: text("stone_type").notNull(),
  pumpRequired: text("pump_required").notNull(),
  pumpOperator: text("pump_operator"),
  assignedVehicle: text("assigned_vehicle"),
  truckCapacityM3: decimal("truck_capacity_m3", { precision: 5, scale: 2 }),
  pourType: text("pour_type"),
  salesNote: text("sales_note"),
  planningNote: text("planning_note"),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  createdBy: text("created_by").notNull().references(() => user.id),
  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  version: decimal("version", { precision: 10, scale: 0 }).default("0").notNull(),
}, (t) => [
  index("orders_requested_at_idx").on(t.requestedAt),
  index("orders_status_requested_idx").on(t.status, t.requestedAt),
  index("orders_creator_created_idx").on(t.createdBy, t.createdAt),
  index("orders_planning_basis_idx").on(sql`COALESCE(${t.plannedStartAt}, ${t.requestedAt})`),
  uniqueIndex("orders_booking_no_idx").on(t.bookingNo),
]);

export const orderEvents = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").notNull().references(() => user.id),
  eventType: text("event_type").notNull(),
  fieldName: text("field_name"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("order_events_order_created_idx").on(t.orderId, t.createdAt)]);

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (t) => [uniqueIndex("materials_kind_code_idx").on(t.kind, t.code)]);
