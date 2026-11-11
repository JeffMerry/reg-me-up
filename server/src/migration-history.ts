import { createHash } from 'node:crypto';

export type MigrationRecord = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

export function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function checkAppliedMigrations(records: MigrationRecord[], files: ReadonlyMap<string, string>): void {
  for (const record of records) {
    if (record.rolled_back_at) continue;
    if (!record.finished_at) throw new Error('Unresolved migration failure');
    const content = files.get(record.migration_name);
    if (content === undefined || sha256(content) !== record.checksum) throw new Error('Applied migration history differs from local files');
  }
}
