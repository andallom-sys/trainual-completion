param(
  [string]$TrainualPath = "C:\Users\Margen\Downloads\Users-Report-2026-04-01-16-01-33.csv",
  [string]$RosterPath = "C:\Users\Margen\Downloads\EmployeeRoster-System_1775067143498.csv",
  [string]$OutputSqlPath = ".\supabase\seed.sql",
  [string]$OutputDemoPath = ".\lib\demo-snapshot.ts",
  [string]$SnapshotDate = "2026-04-01"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Text {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  return ($Value.Trim().ToLowerInvariant() -replace "\s+", " ")
}

function Escape-Sql {
  param([string]$Value)
  if ($null -eq $Value -or [string]::IsNullOrWhiteSpace($Value)) {
    return "null"
  }

  return "'" + ($Value -replace "'", "''") + "'"
}

function Extract-ManagerName {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  if ($Value -match "^(.*?)\s+\(") {
    return $matches[1].Trim()
  }

  return $Value.Trim()
}

function Value-OrEmpty {
  param($Value)
  if ($null -eq $Value) {
    return ""
  }

  return [string]$Value
}

$trainualRows = Import-Csv -Path $TrainualPath
$rosterRows = Get-Content -Path $RosterPath | Select-Object -Skip 6 | ConvertFrom-Csv

$rosterByEmail = @{}
$rosterByName = @{}

foreach ($row in $rosterRows) {
  $emailKey = Normalize-Text $row.'Primary Email'
  $name = ((Value-OrEmpty $row.'First Name') + " " + (Value-OrEmpty $row.'Last Name')).Trim()
  $nameKey = Normalize-Text $name
  $managerName = Extract-ManagerName $row.'Manager Name'

  $mapped = [ordered]@{
    employee_id = if ([string]::IsNullOrWhiteSpace($row.'Employee Id')) { $null } else { $row.'Employee Id'.Trim() }
    employee_status = if ([string]::IsNullOrWhiteSpace($row.'Employee Status')) { $null } else { $row.'Employee Status'.Trim() }
    roster_manager_name = $managerName
  }

  if ($emailKey) {
    $rosterByEmail[$emailKey] = $mapped
  }

  if ($nameKey) {
    $rosterByName[$nameKey] = $mapped
  }
}

$records = @()

foreach ($row in $trainualRows) {
  $email = (Value-OrEmpty $row.Email).Trim().ToLowerInvariant()
  $name = (Value-OrEmpty $row.Name).Trim()
  $completion = (Value-OrEmpty $row.'Completion score').TrimEnd('%')
  if ([string]::IsNullOrWhiteSpace($completion)) {
    $completion = "0"
  }
  $groups = @()

  if (-not [string]::IsNullOrWhiteSpace($row.Groups)) {
    $groups = @(($row.Groups -split ",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  }

  $roster = $null
  $emailKey = Normalize-Text $email
  $nameKey = Normalize-Text $name

  if ($emailKey -and $rosterByEmail.ContainsKey($emailKey)) {
    $roster = $rosterByEmail[$emailKey]
  } elseif ($nameKey -and $rosterByName.ContainsKey($nameKey)) {
    $roster = $rosterByName[$nameKey]
  }

  $managerName = $null

  if ($roster -and $roster.roster_manager_name) {
    $managerName = $roster.roster_manager_name
  } elseif (-not [string]::IsNullOrWhiteSpace($row.'Reports to')) {
    $managerName = $row.'Reports to'.Trim()
  }

  $records += [pscustomobject][ordered]@{
    snapshot_date = $SnapshotDate
    employee_id = if ($roster) { $roster.employee_id } else { $null }
    employee_name = $name
    employee_email = $email
    job_title = if ([string]::IsNullOrWhiteSpace($row.'Job title')) { $null } else { $row.'Job title'.Trim() }
    completion_score = [int]$completion
    trainual_manager_name = if ([string]::IsNullOrWhiteSpace($row.'Reports to')) { $null } else { $row.'Reports to'.Trim() }
    roster_manager_name = if ($roster) { $roster.roster_manager_name } else { $null }
    manager_name = $managerName
    manager_email = $null
    employee_status = if ($roster) { $roster.employee_status } else { $null }
    last_active = if ([string]::IsNullOrWhiteSpace($row.'Last active')) { $null } else { $row.'Last active'.Trim() }
    groups = $groups
  }
}

$records = $records | Sort-Object completion_score, employee_name

$sqlLines = @(
  "-- Generated from Trainual and roster exports on $(Get-Date -Format s)",
  "truncate table public.employee_completion_snapshots;",
  ""
)

foreach ($record in $records) {
  $recordGroups = @($record.groups)
  $groupSql = if ($recordGroups.Count -eq 0) {
    "'{}'::text[]"
  } else {
    "array[" + (($recordGroups | ForEach-Object { Escape-Sql $_ }) -join ", ") + "]::text[]"
  }

  $sqlLines += "insert into public.employee_completion_snapshots (snapshot_date, employee_id, employee_name, employee_email, job_title, completion_score, trainual_manager_name, roster_manager_name, manager_name, manager_email, employee_status, last_active, groups) values (" +
    "$(Escape-Sql $record.snapshot_date)::date, " +
    "$(Escape-Sql $record.employee_id), " +
    "$(Escape-Sql $record.employee_name), " +
    "$(Escape-Sql $record.employee_email), " +
    "$(Escape-Sql $record.job_title), " +
    "$($record.completion_score), " +
    "$(Escape-Sql $record.trainual_manager_name), " +
    "$(Escape-Sql $record.roster_manager_name), " +
    "$(Escape-Sql $record.manager_name), " +
    "$(Escape-Sql $record.manager_email), " +
    "$(Escape-Sql $record.employee_status), " +
    "$(Escape-Sql $record.last_active), " +
    "$groupSql);"
}

$tsJson = $records | ConvertTo-Json -Depth 5
$tsContent = @"
import type { EmployeeCompletionRow } from "@/lib/types";

export const demoEmployees: EmployeeCompletionRow[] = $tsJson;
"@

Set-Content -Path $OutputSqlPath -Value ($sqlLines -join [Environment]::NewLine) -Encoding utf8
Set-Content -Path $OutputDemoPath -Value $tsContent -Encoding utf8

Write-Host "Generated $($records.Count) employee rows."
Write-Host "SQL seed: $OutputSqlPath"
Write-Host "Demo data: $OutputDemoPath"
