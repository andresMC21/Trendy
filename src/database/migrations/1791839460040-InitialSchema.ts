import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791839460040 implements MigrationInterface {
    name = 'InitialSchema1791839460040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'USER', 'MODERATOR')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password" text NOT NULL, "fullName" text NOT NULL, "photoUrl" text, "info" text, "verificationStatus" text NOT NULL DEFAULT 'UNVERIFIED', "ratingAverage" double precision NOT NULL DEFAULT '0', "reviewsCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "role" "public"."user_role_enum" array NOT NULL DEFAULT '{USER}', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sellerId" uuid NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "price" numeric(12,2) NOT NULL DEFAULT '0', "acceptsBarter" boolean NOT NULL DEFAULT false, "category" text NOT NULL, "condition" text NOT NULL DEFAULT 'USADO', "status" text NOT NULL DEFAULT 'AVAILABLE', "location" geography(Point,4326) NOT NULL, "neighborhoodId" text NOT NULL, "estimatedWeightKg" numeric(8,2), "viewsCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5cac481d22dacaf4d53f900a3" ON "product"  ("sellerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d71ac3a30622a475df871b5513" ON "product"  ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_01286e06a0554cbb19375f0178" ON "product"  ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3cbcabdb0a2b87ee77a3175483" ON "product" USING gist ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_94a66829c6c4ca232a7b0a121c" ON "product"  ("neighborhoodId") `);
        await queryRunner.query(`CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transactionId" uuid NOT NULL, "reviewerId" uuid NOT NULL, "targetUserId" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_10e50d0529aca22265ffc6b7158" UNIQUE ("transactionId", "reviewerId"), CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "buyerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "status" text NOT NULL DEFAULT 'PENDING', "safePointId" text, "scheduledTime" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "message" text, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fd965536176f304a7dd6493716" ON "transaction"  ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ef5d5742e52e2bca6d8798dda" ON "transaction"  ("buyerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_da429de57e23852dae37f1d182" ON "transaction"  ("sellerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_63f749fc7f7178ae1ad85d3b95" ON "transaction"  ("status") `);
        await queryRunner.query(`CREATE TABLE "product_favorites" ("productId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_f1234056bc59c719e6b8536e21f" PRIMARY KEY ("productId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e77761f6faae49a6cb68182f1" ON "product_favorites"  ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9599d7698cbd231acf287d7c56" ON "product_favorites"  ("userId") `);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_d5cac481d22dacaf4d53f900a3f" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_34413365b39e3bf5bea866569b4" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_6130acea7858093c9e2b20726a0" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_fd965536176f304a7dd64937165" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_2ef5d5742e52e2bca6d8798dda5" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_da429de57e23852dae37f1d182b" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_favorites" ADD CONSTRAINT "FK_9e77761f6faae49a6cb68182f1a" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_favorites" ADD CONSTRAINT "FK_9599d7698cbd231acf287d7c563" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_9599d7698cbd231acf287d7c563"`);
        await queryRunner.query(`ALTER TABLE "product_favorites" DROP CONSTRAINT "FK_9e77761f6faae49a6cb68182f1a"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_da429de57e23852dae37f1d182b"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_2ef5d5742e52e2bca6d8798dda5"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_fd965536176f304a7dd64937165"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_6130acea7858093c9e2b20726a0"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_34413365b39e3bf5bea866569b4"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_d5cac481d22dacaf4d53f900a3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9599d7698cbd231acf287d7c56"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e77761f6faae49a6cb68182f1"`);
        await queryRunner.query(`DROP TABLE "product_favorites"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63f749fc7f7178ae1ad85d3b95"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da429de57e23852dae37f1d182"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ef5d5742e52e2bca6d8798dda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd965536176f304a7dd6493716"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94a66829c6c4ca232a7b0a121c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cbcabdb0a2b87ee77a3175483"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01286e06a0554cbb19375f0178"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d71ac3a30622a475df871b5513"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5cac481d22dacaf4d53f900a3"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
