#!/bin/bash
cd /home/kavia/workspace/code-generation/contact-manager-203779-203789/contact_manager_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

