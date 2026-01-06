-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "seguranca";

-- CreateEnum
CREATE TYPE "seguranca"."Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "public"."Sexo" AS ENUM ('MACHO', 'FEMEA', 'INDETERMINADO');

-- CreateTable
CREATE TABLE "seguranca"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" VARCHAR(90) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "seguranca"."Role" NOT NULL,
    "name" VARCHAR(90) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aves" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "anilha" VARCHAR(50) NOT NULL,
    "nascimento" TIMESTAMP(3) NOT NULL,
    "cig" VARCHAR(50) NOT NULL,
    "sexo" "public"."Sexo" NOT NULL,
    "pai_id" TEXT,
    "mae_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "seguranca"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "seguranca"."users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "aves_anilha_key" ON "public"."aves"("anilha");

-- CreateIndex
CREATE INDEX "aves_pai_id_idx" ON "public"."aves"("pai_id");

-- CreateIndex
CREATE INDEX "aves_mae_id_idx" ON "public"."aves"("mae_id");

-- CreateIndex
CREATE INDEX "aves_sexo_idx" ON "public"."aves"("sexo");

-- CreateIndex
CREATE INDEX "aves_nascimento_idx" ON "public"."aves"("nascimento");

-- AddForeignKey
ALTER TABLE "public"."aves" ADD CONSTRAINT "aves_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "public"."aves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aves" ADD CONSTRAINT "aves_mae_id_fkey" FOREIGN KEY ("mae_id") REFERENCES "public"."aves"("id") ON DELETE SET NULL ON UPDATE CASCADE;
