import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---- Enums ----
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending", // link gerado, ainda não enviado
  "sent", // link enviado ao paciente
  "completed", // paciente respondeu
  "expired", // substituído por um novo ciclo
]);

export const questionTypeEnum = pgEnum("question_type", [
  "text",
  "textarea",
  "single_choice",
  "multi_choice",
  "scale",
  "boolean",
]);

// ---- Pacientes ----
export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  birthDate: date("birth_date"), // opcional — pode ser preenchido depois
  cpf: text("cpf").unique(), // opcional — pode ser preenchido depois
  planStartDate: date("plan_start_date").notNull(),
  planEndDate: date("plan_end_date").notNull(),
  phone: text("phone"), // E.164, ex: +5511999999999 — opcional por hora (campo removido do cadastro)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Formulários ----
export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const formQuestions = pgTable("form_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  type: questionTypeEnum("type").notNull(),
  label: text("label").notNull(),
  // opções para single_choice / multi_choice; { min, max } para scale
  options: jsonb("options").$type<string[] | { min: number; max: number } | null>(),
  required: boolean("required").notNull().default(true),
});

// ---- Convites (links) ----
export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id),
  token: uuid("token").notNull().unique().defaultRandom(),
  status: inviteStatusEnum("status").notNull().default("pending"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Respostas ----
export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  inviteId: uuid("invite_id")
    .notNull()
    .references(() => invites.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  // snapshot { questionId: valor }
  answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  seen: boolean("seen").notNull().default(false),
});

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type FormQuestion = typeof formQuestions.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Response = typeof responses.$inferSelect;
