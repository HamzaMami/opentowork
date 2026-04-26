#!/usr/bin/env bash
set -euo pipefail

# Apply Sonar config to GitHub Actions from local files.
# Requires: gh CLI authenticated for this repository.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VARS_FILE="${ROOT_DIR}/sonar.vars"
SECRETS_FILE="${ROOT_DIR}/sonar.secrets"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed."
  exit 1
fi

if [[ ! -f "${VARS_FILE}" ]]; then
  echo "Error: ${VARS_FILE} not found. Create it from sonar.vars.example"
  exit 1
fi

if [[ ! -f "${SECRETS_FILE}" ]]; then
  echo "Error: ${SECRETS_FILE} not found. Create it from sonar.secrets.example"
  exit 1
fi

# shellcheck disable=SC1090
source "${VARS_FILE}"
# shellcheck disable=SC1090
source "${SECRETS_FILE}"

if [[ -z "${SONAR_PROJECT_KEY:-}" || -z "${SONAR_ORGANIZATION:-}" ]]; then
  echo "Error: SONAR_PROJECT_KEY and SONAR_ORGANIZATION must be set in sonar.vars"
  exit 1
fi

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "Error: SONAR_TOKEN must be set in sonar.secrets"
  exit 1
fi

echo "Setting repository variables..."
gh variable set SONAR_PROJECT_KEY --body "${SONAR_PROJECT_KEY}"
gh variable set SONAR_ORGANIZATION --body "${SONAR_ORGANIZATION}"

echo "Setting repository secret..."
gh secret set SONAR_TOKEN --body "${SONAR_TOKEN}"

echo "Done. GitHub Actions Sonar settings updated."
