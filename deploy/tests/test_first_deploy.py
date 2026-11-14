"""Offline only: git and gcloud are stubbed; no cloud access."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class FirstDeploy(unittest.TestCase):
    def run_plan(self, execute=False, fail_migration=False, region='asia-southeast1'):
        with tempfile.TemporaryDirectory(prefix='regmeup-deploy-test-') as tmp:
            root = Path(tmp)
            log = root / 'calls.txt'
            (root / 'git').write_text('#!/usr/bin/env bash\ncase "$1" in rev-parse) printf "a%.0s" {1..40}; echo;; branch) echo main;; status) :;; *) exit 1;; esac\n', encoding='utf-8', newline='\n')
            (root / 'gcloud').write_text('''#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$STUB_LOG"
if [[ "$*" == *'jobs execute'* && "$FAIL_MIGRATION" == 1 ]]; then exit 1; fi
if [[ "$*" == *'artifacts docker images describe'* ]]; then printf 'sha256:'; printf 'b%.0s' {1..64}; echo; fi
if [[ "$*" == *'services describe'* ]]; then echo https://regmeup-test.run.app; fi
''', encoding='utf-8', newline='\n')
            for name in ('git', 'gcloud'):
                (root / name).chmod(0o755)
            env = dict(os.environ, PROJECT_ID='example-demo-project', REGION=region,
                       REGISTRY_REPOSITORY='regmeup', SQL_CONNECTION=f'example-demo-project:{region}:regmeup-pg',
                       RUNTIME_SERVICE_ACCOUNT='regmeup-runner@example-demo-project.iam.gserviceaccount.com',
                       DATABASE_SECRET_VERSION='db-url:1', SESSION_SECRET_VERSION='session:1',
                       DRY_RUN='0' if execute else '1', CONFIRM_GCP_MUTATION='example-demo-project',
                       STUB_LOG=log.as_posix(), FAIL_MIGRATION='1' if fail_migration else '0')
            bash = os.environ.get('BASH_EXE', 'bash')
            command = f'git() {{ bash "{root.as_posix()}/git" "$@"; }}; gcloud() {{ bash "{root.as_posix()}/gcloud" "$@"; }}; export -f git gcloud; bash deploy/deploy.sh'
            result = subprocess.run([bash, '-c', command], env=env, capture_output=True, text=True)
            return result, log.read_text() if log.exists() else ''

    def test_preview_has_no_cloud_calls(self):
        result, log = self.run_plan()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(log, '')
        self.assertIn('db:migrate', result.stdout)
        self.assertNotIn('db:seed', result.stdout)

    def test_unknown_region_rejected(self):
        result, log = self.run_plan(region='TBD')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Set REGION explicitly', result.stderr)
        self.assertEqual(log, '')

    def test_migration_failure_stops_service_deploy(self):
        result, log = self.run_plan(execute=True, fail_migration=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('jobs execute', log)
        self.assertNotIn('run deploy ', log)

    def test_digest_and_exact_origin(self):
        result, log = self.run_plan(execute=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('@sha256:' + 'b' * 64, log)
        self.assertIn('APP_ORIGIN=https://regmeup-test.run.app', log)


if __name__ == '__main__':
    unittest.main()
