import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceUserPhotoUrlWithTokenVersion1791846000000 implements MigrationInterface {
  name = 'ReplaceUserPhotoUrlWithTokenVersion1791846000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "tokenVersion" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photoUrl"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "photoUrl" text`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenVersion"`);
  }
}
