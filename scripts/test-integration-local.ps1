# Prepare only the repository's local Compose test database, then run all integration tests.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskNames = @('DATABASE_URL', 'TEST_DATABASE_URL', 'ALLOW_SYNTHETIC_SEED', 'SEED_PASSWORD', 'NODE_ENV')
$taskPrevious = @{}
foreach ($taskName in $taskNames) {
    $taskPrevious[$taskName] = [Environment]::GetEnvironmentVariable($taskName, 'Process')
}
$taskExitCode = 1
Push-Location $taskRoot
try {
    docker compose up -d --wait postgres
    if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL startup failed. Start Docker Desktop with the Linux engine and retry.' }

    $taskPublishedPorts = @(docker compose port postgres 5432)
    if ($LASTEXITCODE -ne 0 -or $taskPublishedPorts.Count -eq 0) { throw 'Could not read the published PostgreSQL port from the running Compose service.' }
    $taskPort = ($taskPublishedPorts[-1] -split ':')[-1]
    if ($taskPort -notmatch '^\d+$' -or [int]$taskPort -lt 1 -or [int]$taskPort -gt 65535) {
        throw 'REGMEUP_PG_PORT must be a valid local TCP port.'
    }
    $env:NODE_ENV = 'test'
    $env:TEST_DATABASE_URL = "postgresql://regmeup_app:regmeup-local-only@127.0.0.1:${taskPort}/regmeup_test"
    $env:DATABASE_URL = $env:TEST_DATABASE_URL
    $env:ALLOW_SYNTHETIC_SEED = '1'
    $env:SEED_PASSWORD = 'synthetic-password-for-test-only'

    npm.cmd run db:generate
    if ($LASTEXITCODE -ne 0) { throw 'Prisma generation failed.' }
    npm.cmd run db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'Test database migration failed. Check the local Compose database; do not delete its volume.' }
    npm.cmd run db:seed
    if ($LASTEXITCODE -ne 0) { throw 'Synthetic test seed failed.' }
    Get-Content -Raw docker/postgres/enable-test-guard.sql | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test
    if ($LASTEXITCODE -ne 0) { throw 'Test database guard installation failed.' }

    $env:DATABASE_URL = "postgresql://regmeup_app:regmeup-local-only@127.0.0.1:${taskPort}/regmeup_dev"
    npm.cmd run test:integration
    $taskExitCode = $LASTEXITCODE
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    foreach ($taskName in $taskNames) {
        [Environment]::SetEnvironmentVariable($taskName, $taskPrevious[$taskName], 'Process')
    }
    Pop-Location
}
exit $taskExitCode
